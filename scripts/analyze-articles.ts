#!/usr/bin/env tsx

import dotenv from 'dotenv'
import path from 'path'
import OpenAI from 'openai'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

interface Article {
  title: string
  description: string
  url: string
  source: string
}

interface ActivistAnalysis {
  activistName: string
  status: 'released' | 'detained' | 'transferred' | 'unknown' | 'no_change'
  confidence: 'high' | 'medium' | 'low'
  summary: string
  keyFacts: string[]
  sourceArticles: string[]
}

class ArticleAnalyzer {
  private openai: OpenAI

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required')
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  async analyzeActivist(activistName: string, articles: Article[]): Promise<ActivistAnalysis> {
    if (articles.length === 0) {
      return {
        activistName,
        status: 'no_change',
        confidence: 'low',
        summary: 'No articles found',
        keyFacts: [],
        sourceArticles: []
      }
    }

    const prompt = `Analyze the following news articles about activist "${activistName}" and determine their current status.

ARTICLES:
${articles.map((article, index) => `
${index + 1}. Title: "${article.title}"
   Source: ${article.source}
   Content: ${article.description}
   URL: ${article.url}
`).join('\n')}

INSTRUCTIONS:
1. Determine the activist's current status based on the articles
2. Look for keywords like: released, freed, detained, arrested, transferred, deported, returned
3. Be conservative - if uncertain, mark as 'unknown' with low confidence
4. Focus on recent information (last few days)

STATUS OPTIONS:
- 'released': Clear evidence of release/freedom
- 'detained': Clear evidence of continued or new detention  
- 'transferred': Moved to different facility/location
- 'unknown': Unclear status from available information
- 'no_change': No relevant status update found

CONFIDENCE LEVELS:
- 'high': Multiple sources confirm the same information
- 'medium': Single reliable source with clear information
- 'low': Uncertain or conflicting information

Return your analysis in this exact JSON format:
{
  "status": "released|detained|transferred|unknown|no_change",
  "confidence": "high|medium|low", 
  "summary": "Brief 2-3 sentence summary of what happened",
  "keyFacts": ["Fact 1", "Fact 2", "Fact 3"],
  "sourceArticles": ["URL1", "URL2"]
}`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert news analyst specializing in tracking detained activists and humanitarian workers. Analyze news articles and extract structured information about activist status changes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      // Parse JSON response
      const analysis = JSON.parse(content)
      
      return {
        activistName,
        status: analysis.status,
        confidence: analysis.confidence,
        summary: analysis.summary,
        keyFacts: analysis.keyFacts || [],
        sourceArticles: analysis.sourceArticles || []
      }

    } catch (error) {
      console.error(`❌ Error analyzing ${activistName}:`, error)
      return {
        activistName,
        status: 'unknown',
        confidence: 'low',
        summary: 'Analysis failed',
        keyFacts: [],
        sourceArticles: []
      }
    }
  }
}

// Test function
async function testAnalysis() {
  console.log('🧠 Testing LLM Article Analysis...')
  
  const analyzer = new ArticleAnalyzer()
  
  // Test with Tadhg Hickey articles
  const testArticles: Article[] = [
    {
      title: "Irish activists, including Cork comedian Tadhg Hickey, arrive home",
      description: "Irish activists who were detained in Israel after participating in a Gaza aid flotilla have arrived home. Among them was Cork comedian Tadhg Hickey, who was part of the humanitarian mission...",
      url: "https://www.irishexaminer.com/news/munster/arid-41719884.html",
      source: "DuckDuckGo"
    },
    {
      title: "Cork citizens among Gaza flotilla participants released from Israeli prison",
      description: "Several Cork citizens, including comedian Tadhg Hickey, have been released from Israeli detention after being held for several days following the interception of the Gaza aid flotilla...",
      url: "https://www.echolive.ie/corknews/arid-41719182.html", 
      source: "DuckDuckGo"
    }
  ]

  const analysis = await analyzer.analyzeActivist('Tadhg Hickey', testArticles)
  
  console.log('\n📊 Analysis Results:')
  console.log(`Name: ${analysis.activistName}`)
  console.log(`Status: ${analysis.status}`)
  console.log(`Confidence: ${analysis.confidence}`)
  console.log(`Summary: ${analysis.summary}`)
  console.log(`Key Facts: ${analysis.keyFacts.join(', ')}`)
  console.log(`Sources: ${analysis.sourceArticles.length} articles`)
}

// Run if called directly
if (require.main === module) {
  testAnalysis().catch(console.error)
}

export { ArticleAnalyzer, type ActivistAnalysis, type Article }
