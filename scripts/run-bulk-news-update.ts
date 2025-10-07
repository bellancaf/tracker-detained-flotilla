#!/usr/bin/env node

// Load environment variables
import dotenv from 'dotenv'
import path from 'path'

// Try to load .env.local first, then .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { NewsScraper } from './bulk-news-scraper'
import { LLMNewsProcessor } from './llm-news-processor'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface BulkUpdateConfig {
  maxActivistsPerRun: number
  enableNewsAPI: boolean
  enableBingNews: boolean
  enableDuckDuckGo: boolean
  dryRun: boolean
}

class BulkNewsUpdateOrchestrator {
  private config: BulkUpdateConfig

  constructor(config: Partial<BulkUpdateConfig> = {}) {
    this.config = {
      maxActivistsPerRun: config.maxActivistsPerRun || 50, // Limit for cost control
      enableNewsAPI: config.enableNewsAPI ?? true,
      enableBingNews: config.enableBingNews ?? true,
      enableDuckDuckGo: config.enableDuckDuckGo ?? true,
      dryRun: config.dryRun ?? false
    }
  }

  async run(): Promise<void> {
    console.log('🚀 Starting Bulk News Update Process')
    console.log('=' .repeat(50))
    
    try {
      // Step 1: Check environment and configuration
      await this.checkEnvironment()
      
      // Step 2: Get activists to process
      const activists = await this.getActivistsToProcess()
      console.log(`📊 Found ${activists.length} activists to process`)
      
      if (activists.length === 0) {
        console.log('ℹ️ No activists to process. Exiting.')
        return
      }

      // Step 3: Run news scraping
      console.log('\n🔍 Phase 1: News Scraping')
      console.log('-'.repeat(30))
      const scraper = new NewsScraper()
      const scrapingResults = await this.runScraping(activists, scraper)
      
      // Step 4: Process with LLM
      console.log('\n🤖 Phase 2: LLM Processing')
      console.log('-'.repeat(30))
      const processor = new LLMNewsProcessor()
      const updates = await this.runLLMProcessing(scrapingResults, processor)
      
      // Step 5: Save results
      console.log('\n💾 Phase 3: Saving Results')
      console.log('-'.repeat(30))
      await this.saveResults(updates, processor)
      
      // Step 6: Generate summary
      this.generateFinalSummary(updates)
      
    } catch (error) {
      console.error('❌ Bulk update process failed:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  private async checkEnvironment(): Promise<void> {
    console.log('🔧 Checking environment...')
    
    const requiredEnvVars = ['OPENAI_API_KEY']
    const optionalEnvVars = ['NEWSAPI_KEY', 'BING_SEARCH_KEY']
    
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
    
    const available = optionalEnvVars.filter(envVar => process.env[envVar])
    console.log(`✅ Environment check passed`)
    console.log(`📡 Available APIs: ${available.length > 0 ? available.join(', ') : 'DuckDuckGo only'}`)
  }

  private async getActivistsToProcess(): Promise<any[]> {
    // Get activists that haven't been checked recently (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const activists = await prisma.activist.findMany({
      where: {
        OR: [
          { updatedAt: { lt: sevenDaysAgo } },
          { status: { in: ['detained', 'unknown'] } } // Focus on detained/unknown status
        ]
      },
      select: {
        id: true,
        name: true,
        nationality: true,
        boatName: true,
        status: true,
        updatedAt: true
      },
      take: this.config.maxActivistsPerRun,
      orderBy: [
        { status: 'asc' }, // Prioritize detained activists
        { updatedAt: 'asc' } // Then by oldest updated
      ]
    })
    
    return activists
  }

  private async runScraping(activists: any[], scraper: NewsScraper): Promise<any[]> {
    if (this.config.dryRun) {
      console.log('🧪 DRY RUN: Would scrape news for', activists.length, 'activists')
      return []
    }

    // Override scraper batch size for cost control
    scraper['batchSize'] = Math.min(10, Math.ceil(activists.length / 5))
    
    const results = await scraper.processBatch(activists)
    
    // Save intermediate results
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `scraped-news-${timestamp}.json`
    const fs = require('fs')
    fs.writeFileSync(filename, JSON.stringify(results, null, 2))
    console.log(`💾 Scraping results saved to ${filename}`)
    
    return results
  }

  private async runLLMProcessing(scrapingResults: any[], processor: LLMNewsProcessor): Promise<any[]> {
    if (this.config.dryRun) {
      console.log('🧪 DRY RUN: Would process', scrapingResults.length, 'scraping results with LLM')
      return []
    }

    if (scrapingResults.length === 0) {
      console.log('ℹ️ No scraping results to process')
      return []
    }

    // Override processor batch size for cost control
    processor['batchSize'] = 3 // Smaller batches to control costs
    
    const updates = await processor.processActivistBatch(scrapingResults)
    return updates
  }

  private async saveResults(updates: any[], processor: LLMNewsProcessor): Promise<void> {
    if (this.config.dryRun) {
      console.log('🧪 DRY RUN: Would save', updates.length, 'updates as submissions')
      return
    }

    if (updates.length === 0) {
      console.log('ℹ️ No updates to save')
      return
    }

    await processor.saveUpdatesAsSubmissions(updates)
  }

  private generateFinalSummary(updates: any[]): void {
    console.log('\n🎉 BULK UPDATE COMPLETE')
    console.log('=' .repeat(50))
    
    if (updates.length === 0) {
      console.log('ℹ️ No updates generated in this run')
      return
    }

    // Generate summary
    this.generateSummary(updates)
    
    // Cost estimation
    const estimatedCost = this.estimateCost(updates.length)
    console.log(`\n💰 Estimated OpenAI API cost: ~$${estimatedCost.toFixed(4)}`)
    
    console.log('\n📋 Next Steps:')
    console.log('1. Review pending submissions in admin panel')
    console.log('2. Approve/reject auto-generated updates')
    console.log('3. Approved updates will be added to activist timelines')
  }

  private generateSummary(updates: any[]): void {
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

  private estimateCost(updateCount: number): number {
    // Rough estimation based on GPT-3.5-turbo pricing
    // ~2000 tokens per batch of 5 activists = $0.003 per batch
    const batches = Math.ceil(updateCount / 5)
    return batches * 0.003
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  
  const config: Partial<BulkUpdateConfig> = {
    dryRun: args.includes('--dry-run'),
    maxActivistsPerRun: 50 // Default limit
  }
  
  // Parse command line arguments
  const maxActivistsIndex = args.indexOf('--max-activists')
  if (maxActivistsIndex !== -1 && args[maxActivistsIndex + 1]) {
    config.maxActivistsPerRun = parseInt(args[maxActivistsIndex + 1])
  }
  
  if (args.includes('--help')) {
    console.log(`
Bulk News Update Script

Usage: npm run bulk-news-update [options]

Options:
  --dry-run              Run without making API calls or saving data
  --max-activists N      Maximum number of activists to process (default: 50)
  --help                 Show this help message

Environment Variables Required:
  OPENAI_API_KEY         OpenAI API key for LLM processing

Environment Variables Optional:
  NEWSAPI_KEY           NewsAPI.org key (1000 requests/day free)
  BING_SEARCH_KEY       Bing Search API key (1000 requests/month free)

Examples:
  npm run bulk-news-update                    # Process up to 50 activists
  npm run bulk-news-update --dry-run          # Test run without API calls
  npm run bulk-news-update --max-activists 20 # Process only 20 activists
`)
    return
  }

  const orchestrator = new BulkNewsUpdateOrchestrator(config)
  
  try {
    await orchestrator.run()
  } catch (error) {
    console.error('❌ Process failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { BulkNewsUpdateOrchestrator }
