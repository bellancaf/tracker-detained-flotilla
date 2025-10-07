// Load environment variables
import dotenv from 'dotenv'
import path from 'path'

// Try to load .env.local first, then .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'
import fs from 'fs'

const prisma = new PrismaClient()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface NewsResult {
  title: string
  description: string
  url: string
  publishedAt: string
  source: string
}

interface ActivistSearchResult {
  activistId: string
  activistName: string
  nationality: string
  boatName: string
  newsResults: NewsResult[]
  searchQueries: string[]
}

interface ProcessedUpdate {
  activistId: string
  activistName: string
  statusUpdate: 'released' | 'detained' | 'transferred' | 'unknown' | 'no_change'
  eventDate: string
  sourceTitle: string
  description: string
  sourceUrl: string
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

class LLMNewsProcessor {
  private batchSize = 5 // Process 5 activists at a time to optimize API usage
  private maxTokens = 2000 // Keep responses concise

  async processActivistBatch(activists: ActivistSearchResult[]): Promise<ProcessedUpdate[]> {
    if (activists.length === 0) return []

    // Filter out activists with no news
    const activistsWithNews = activists.filter(activist => activist.newsResults.length > 0)
    
    if (activistsWithNews.length === 0) {
      console.log('No activists with news found in this batch')
      return []
    }

    const prompt = this.buildBatchPrompt(activistsWithNews)

    try {
      console.log(`🤖 Processing ${activistsWithNews.length} activists with LLM...`)
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Use cheaper model for cost efficiency
        messages: [
          {
            role: 'system',
            content: `You are an expert news analyst specializing in tracking detained activists and humanitarian workers. Your job is to analyze news articles and determine if they contain updates about activist status changes.

CRITICAL INSTRUCTIONS:
1. Only suggest status updates if there is CLEAR evidence in the news articles
2. Be conservative - if uncertain, mark as 'no_change' with low confidence
3. Focus on recent news (last 14 days)
4. Look for keywords like: released, freed, detained, arrested, transferred, deported, returned
5. Return structured JSON for each activist

STATUS OPTIONS:
- 'released': Clear evidence of release/freedom
- 'detained': Clear evidence of continued or new detention
- 'transferred': Moved to different facility/location
- 'unknown': Unclear status from available information
- 'no_change': No relevant status update found

CONFIDENCE LEVELS:
- 'high': Multiple sources confirm the same information
- 'medium': Single reliable source with clear information
- 'low': Uncertain or conflicting information`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.1 // Low temperature for consistent, factual responses
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      // Parse the JSON response
      const updates = this.parseLLMResponse(content, activistsWithNews)
      return updates

    } catch (error) {
      console.error('❌ LLM processing error:', error)
      return []
    }
  }

  private buildBatchPrompt(activists: ActivistSearchResult[]): string {
    let prompt = `Analyze the following news articles for each activist and determine if there are any status updates. Return a JSON array with your analysis.

FORMAT: Return ONLY a valid JSON array with this structure:
[
  {
    "activistName": "Full Name",
    "statusUpdate": "released|detained|transferred|unknown|no_change",
    "eventDate": "YYYY-MM-DD",
    "sourceTitle": "Most relevant article title",
    "description": "Brief summary of the update",
    "sourceUrl": "URL of the source article",
    "confidence": "high|medium|low",
    "reasoning": "Brief explanation of your decision"
  }
]

ACTIVISTS TO ANALYZE:

`

    activists.forEach((activist, index) => {
      prompt += `${index + 1}. ACTIVIST: ${activist.activistName}
   Nationality: ${activist.nationality}
   Boat: ${activist.boatName}
   
   NEWS ARTICLES:
`
      
      activist.newsResults.forEach((article, articleIndex) => {
        prompt += `   ${articleIndex + 1}. ${article.title}
      Source: ${article.source}
      Date: ${article.publishedAt}
      URL: ${article.url}
      Description: ${article.description}
      
`
      })
      
      prompt += '\n'
    })

    prompt += `Remember: Only suggest updates if there is clear evidence. Be conservative and mark as 'no_change' if uncertain.`

    return prompt
  }

  private parseLLMResponse(content: string, activists: ActivistSearchResult[]): ProcessedUpdate[] {
    try {
      // Clean the response - remove any markdown formatting
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      const parsed = JSON.parse(cleanedContent)
      
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array')
      }

      // Map the LLM response to our database format
      return parsed.map((item: any) => {
        const activist = activists.find(a => a.activistName === item.activistName)
        
        return {
          activistId: activist?.activistId || '',
          activistName: item.activistName,
          statusUpdate: item.statusUpdate,
          eventDate: item.eventDate,
          sourceTitle: item.sourceTitle,
          description: item.description,
          sourceUrl: item.sourceUrl,
          confidence: item.confidence,
          reasoning: item.reasoning
        }
      }).filter(update => update.activistId) // Only include valid updates

    } catch (error) {
      console.error('❌ Failed to parse LLM response:', error)
      console.error('Raw response:', content)
      return []
    }
  }

  async processScrapedData(filename: string): Promise<ProcessedUpdate[]> {
    console.log(`📖 Reading scraped data from ${filename}...`)
    
    if (!fs.existsSync(filename)) {
      throw new Error(`File ${filename} not found`)
    }

    const data: ActivistSearchResult[] = JSON.parse(fs.readFileSync(filename, 'utf-8'))
    console.log(`📊 Found ${data.length} activists to process`)

    const allUpdates: ProcessedUpdate[] = []
    
    // Process in batches to optimize API usage
    for (let i = 0; i < data.length; i += this.batchSize) {
      const batch = data.slice(i, i + this.batchSize)
      console.log(`\n🔄 Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(data.length / this.batchSize)}`)
      
      const batchUpdates = await this.processActivistBatch(batch)
      allUpdates.push(...batchUpdates)
      
      // Rate limiting between batches
      if (i + this.batchSize < data.length) {
        console.log('⏳ Waiting 2 seconds before next batch...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    console.log(`\n🎉 LLM processing complete! Generated ${allUpdates.length} potential updates`)
    return allUpdates
  }

  async saveUpdatesAsSubmissions(updates: ProcessedUpdate[]): Promise<void> {
    console.log(`💾 Saving ${updates.length} updates as pending submissions...`)
    
    const submissions = updates.map(update => ({
      activistId: update.activistId,
      eventDate: new Date(update.eventDate),
      sourceTitle: update.sourceTitle,
      description: `[AUTO-GENERATED] ${update.description}\n\nStatus Update: ${update.statusUpdate}\nConfidence: ${update.confidence}\nReasoning: ${update.reasoning}`,
      submitterEmail: 'system@auto-scraper.com',
      status: 'pending' as const
    }))

    // Save in batches to avoid database timeouts
    const batchSize = 50
    for (let i = 0; i < submissions.length; i += batchSize) {
      const batch = submissions.slice(i, i + batchSize)
      
      try {
        await prisma.submission.createMany({
          data: batch,
          skipDuplicates: true
        })
        console.log(`✅ Saved batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(submissions.length / batchSize)}`)
      } catch (error) {
        console.error(`❌ Error saving batch ${Math.floor(i / batchSize) + 1}:`, error)
      }
    }

    console.log(`🎉 All updates saved as pending submissions for admin review!`)
  }

  generateSummary(updates: ProcessedUpdate[]): void {
    console.log(`\n📈 PROCESSING SUMMARY:`)
    console.log(`  - Total updates generated: ${updates.length}`)
    
    const statusCounts = updates.reduce((acc, update) => {
      acc[update.statusUpdate] = (acc[update.statusUpdate] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log(`  - Status updates by type:`)
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`    ${status}: ${count}`)
    })
    
    const confidenceCounts = updates.reduce((acc, update) => {
      acc[update.confidence] = (acc[update.confidence] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log(`  - Confidence levels:`)
    Object.entries(confidenceCounts).forEach(([confidence, count]) => {
      console.log(`    ${confidence}: ${count}`)
    })
    
    // Show high-confidence releases (most important)
    const highConfidenceReleases = updates.filter(u => 
      u.statusUpdate === 'released' && u.confidence === 'high'
    )
    
    if (highConfidenceReleases.length > 0) {
      console.log(`\n🎉 HIGH CONFIDENCE RELEASES FOUND:`)
      highConfidenceReleases.forEach(update => {
        console.log(`  - ${update.activistName}: ${update.description}`)
      })
    }
  }
}

// Main execution function
async function main() {
  const processor = new LLMNewsProcessor()
  
  try {
    // Get the most recent scraped data file
    const files = fs.readdirSync('.').filter(f => f.startsWith('scraped-news-') && f.endsWith('.json'))
    
    if (files.length === 0) {
      console.error('❌ No scraped news files found. Run the scraper first.')
      return
    }
    
    const latestFile = files.sort().pop()!
    console.log(`📁 Using latest file: ${latestFile}`)
    
    const updates = await processor.processScrapedData(latestFile)
    
    if (updates.length === 0) {
      console.log('ℹ️ No updates generated. All activists may have no relevant news.')
      return
    }
    
    processor.generateSummary(updates)
    
    // Save as submissions for admin review
    await processor.saveUpdatesAsSubmissions(updates)
    
    // Save detailed results to file
    const timestamp = new Date().toISOString().split('T')[0]
    const resultsFile = `processed-updates-${timestamp}.json`
    fs.writeFileSync(resultsFile, JSON.stringify(updates, null, 2))
    console.log(`💾 Detailed results saved to ${resultsFile}`)
    
  } catch (error) {
    console.error('❌ Processing failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { LLMNewsProcessor, ProcessedUpdate }
