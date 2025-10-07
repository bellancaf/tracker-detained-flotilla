#!/usr/bin/env tsx

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'
import { NewsScraper } from './bulk-news-scraper'

interface TestResult {
  timestamp: string
  activists: Array<{
    id: string
    name: string
    nationality: string
    boatName: string
    searchResults: {
      totalArticles: number
      articles: Array<{
        title: string
        description: string
        url: string
        source: string
        publishedAt: string
        relevanceScore: number
      }>
      searchQueries: string[]
      apiResults: {
        newsapi: number
        bing: number
        duckduckgo: number
        startpage: number
        ecosia: number
        searx: number
      }
    }
  }>
  summary: {
    totalActivists: number
    totalArticles: number
    successfulSearches: number
    averageArticlesPerActivist: number
  }
}

const prisma = new PrismaClient()

async function testSearch() {
  console.log('🧪 Testing improved search with 3 activists...')
  
  const testResults: TestResult = {
    timestamp: new Date().toISOString(),
    activists: [],
    summary: {
      totalActivists: 0,
      totalArticles: 0,
      successfulSearches: 0,
      averageArticlesPerActivist: 0
    }
  }
  
  // Get just 3 activists for testing
  const activists = await prisma.activist.findMany({
    select: {
      id: true,
      name: true,
      nationality: true,
      boatName: true
    },
    take: 3
  })

  console.log(`📊 Testing with: ${activists.map(a => a.name).join(', ')}`)

  const scraper = new NewsScraper()
  
  // Initialize the web scraper
  await scraper['webScraper'].initialize()
  
  for (const activist of activists) {
    console.log(`\n🔍 Testing ${activist.name} (${activist.nationality})`)
    
    const result = await scraper.searchForActivist(activist)
    
    // Store results in structured format
    const activistResult = {
      id: activist.id,
      name: activist.name,
      nationality: activist.nationality,
      boatName: activist.boatName,
      searchResults: {
        totalArticles: result.newsResults.length,
        articles: result.newsResults.map(article => ({
          title: article.title,
          description: article.description,
          url: article.url,
          source: article.source,
          publishedAt: article.publishedAt,
          relevanceScore: article.relevanceScore || 0
        })),
        searchQueries: result.searchQueries || [],
        apiResults: {
          newsapi: 0, // We'll need to modify the scraper to return this info
          bing: 0,
          duckduckgo: result.newsResults.filter(a => a.source === 'DuckDuckGo').length,
          startpage: result.newsResults.filter(a => a.source === 'Startpage').length,
          ecosia: result.newsResults.filter(a => a.source === 'Ecosia').length,
          searx: result.newsResults.filter(a => a.source === 'SearX').length
        }
      }
    }
    
    testResults.activists.push(activistResult)
    
    if (result.newsResults.length > 0) {
      console.log(`✅ Found ${result.newsResults.length} articles:`)
      result.newsResults.forEach((article, index) => {
        console.log(`  ${index + 1}. ${article.title}`)
        console.log(`     Source: ${article.source}`)
        console.log(`     URL: ${article.url}`)
        console.log(`     Content: ${article.description.substring(0, 100)}...`)
      })
    } else {
      console.log(`❌ No articles found`)
    }
    
    // Wait between activists
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // Calculate summary
  testResults.summary = {
    totalActivists: activists.length,
    totalArticles: testResults.activists.reduce((sum, a) => sum + a.searchResults.totalArticles, 0),
    successfulSearches: testResults.activists.filter(a => a.searchResults.totalArticles > 0).length,
    averageArticlesPerActivist: testResults.activists.reduce((sum, a) => sum + a.searchResults.totalArticles, 0) / activists.length
  }
  
  // Save to JSON file
  const outputPath = path.join(process.cwd(), 'test-results.json')
  fs.writeFileSync(outputPath, JSON.stringify(testResults, null, 2))
  
  console.log(`\n🎉 Test complete!`)
  console.log(`📊 Summary:`)
  console.log(`   Total activists: ${testResults.summary.totalActivists}`)
  console.log(`   Total articles: ${testResults.summary.totalArticles}`)
  console.log(`   Successful searches: ${testResults.summary.successfulSearches}`)
  console.log(`   Average articles per activist: ${testResults.summary.averageArticlesPerActivist.toFixed(1)}`)
  console.log(`📁 Results saved to: ${outputPath}`)
  
  // Cleanup browser resources
  await scraper.cleanup()
}

// Run the test
testSearch()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
