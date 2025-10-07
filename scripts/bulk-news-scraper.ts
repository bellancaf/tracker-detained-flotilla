// Load environment variables
import dotenv from 'dotenv'
import path from 'path'

// Try to load .env.local first, then .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import { WebScraper } from './web-scraper'

const prisma = new PrismaClient()

// Free API configurations
const API_CONFIGS = {
  newsapi: {
    baseUrl: 'https://newsapi.org/v2/everything',
    apiKey: process.env.NEWSAPI_KEY, // Free: 1000 requests/day
    enabled: !!process.env.NEWSAPI_KEY
  },
  bing: {
    baseUrl: 'https://api.bing.microsoft.com/v7.0/news/search',
    apiKey: process.env.BING_SEARCH_KEY, // Free: 1000 requests/month
    enabled: !!process.env.BING_SEARCH_KEY && process.env.BING_SEARCH_KEY !== 'your-bing-search-key'
  },
  duckduckgo: {
    baseUrl: 'https://html.duckduckgo.com/html',
    enabled: true // Completely free, no API key needed
  },
  // Additional free search options
  searx: {
    baseUrl: 'https://searx.be/search',
    enabled: false // Disabled due to 403 errors - can be enabled if needed
  },
  startpage: {
    baseUrl: 'https://www.startpage.com/sp/search',
    enabled: true // Privacy-focused search engine
  },
  ecosia: {
    baseUrl: 'https://www.ecosia.org/search',
    enabled: true // More bot-friendly search engine
  }
}

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

class NewsScraper {
  private rateLimitDelay = 2000 // 2 seconds between requests
  private batchSize = 5 // Smaller batches
  private maxResultsPerActivist = 3 // Fewer results per activist
  private searchAnalytics = new Map<string, { successCount: number; totalCount: number; avgResults: number }>()
  private apiCallCount = 0
  private maxApiCalls = 50 // Limit total API calls per run
  private webScraper: WebScraper
  
  // API backoff tracking
  private apiBackoff = new Map<string, number>() // API name -> backoff until timestamp

  constructor() {
    this.webScraper = new WebScraper()
  }

  // Check if API is in backoff period
  private isApiInBackoff(apiName: string): boolean {
    const backoffUntil = this.apiBackoff.get(apiName)
    if (!backoffUntil) return false
    return Date.now() < backoffUntil
  }

  // Set API backoff period
  private setApiBackoff(apiName: string, minutes: number = 30): void {
    const backoffUntil = Date.now() + (minutes * 60 * 1000)
    this.apiBackoff.set(apiName, backoffUntil)
    console.log(`⏰ ${apiName} in backoff for ${minutes} minutes`)
  }

  // Score article relevance based on content and keywords
  private scoreArticleRelevance(article: any, query: string): number {
    let score = 0
    const text = `${article.title || ''} ${article.description || ''}`.toLowerCase()
    const queryLower = query.toLowerCase()
    
    // High-value keywords
    const highValueKeywords = ['detained', 'released', 'flotilla', 'gaza', 'humanitarian', 'activist', 'arrested', 'freed']
    const mediumValueKeywords = ['israel', 'palestine', 'aid', 'boat', 'mission', 'protest']
    
    // Check for exact query matches
    if (text.includes(queryLower.replace(/"/g, ''))) {
      score += 0.8
    }
    
    // Check for high-value keywords
    highValueKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 0.3
      }
    })
    
    // Check for medium-value keywords
    mediumValueKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 0.1
      }
    })
    
    // Boost score for recent articles (within last 4 days)
    if (article.publishedAt) {
      const publishedDate = new Date(article.publishedAt)
      const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSincePublished <= 1) {
        score += 0.4 // Big boost for very recent articles
      } else if (daysSincePublished <= 2) {
        score += 0.3
      } else if (daysSincePublished <= 4) {
        score += 0.2
      }
    }
    
    // Boost score for reliable sources
    const reliableSources = ['bbc', 'reuters', 'ap', 'guardian', 'al jazeera', 'haaretz', 'times of israel', 'ynet']
    const sourceName = (article.source?.name || '').toLowerCase()
    if (reliableSources.some(source => sourceName.includes(source))) {
      score += 0.2
    }
    
    return Math.min(score, 1.0) // Cap at 1.0
  }

  // Track search query performance
  private trackQueryPerformance(query: string, resultCount: number): void {
    const analytics = this.searchAnalytics.get(query) || { successCount: 0, totalCount: 0, avgResults: 0 }
    analytics.totalCount++
    if (resultCount > 0) {
      analytics.successCount++
      analytics.avgResults = (analytics.avgResults * (analytics.successCount - 1) + resultCount) / analytics.successCount
    }
    this.searchAnalytics.set(query, analytics)
  }

  // Get search analytics summary
  private getSearchAnalytics(): void {
    const sortedAnalytics = Array.from(this.searchAnalytics.entries())
      .sort((a, b) => b[1].successCount - a[1].successCount)
      .slice(0, 5) // Only show top 5 most successful queries
    
    if (sortedAnalytics.length > 0) {
      console.log('\n📊 Top Performing Queries:')
      sortedAnalytics.forEach(([query, stats]) => {
        const successRate = ((stats.successCount / stats.totalCount) * 100).toFixed(0)
        console.log(`  "${query}" - ${successRate}% success (${stats.avgResults.toFixed(1)} avg results)`)
      })
    }
  }

  async searchNewsAPI(query: string): Promise<NewsResult[]> {
    if (!API_CONFIGS.newsapi.enabled) return []
    
    // Check if API is in backoff period
    if (this.isApiInBackoff('NewsAPI')) {
      return []
    }
    
    // Check if we've hit our API call limit
    if (this.apiCallCount >= this.maxApiCalls) {
      console.warn('⚠️ API call limit reached, skipping NewsAPI')
      return []
    }
    
    this.apiCallCount++

    try {
      const response = await axios.get(API_CONFIGS.newsapi.baseUrl, {
        params: {
          q: query,
          apiKey: API_CONFIGS.newsapi.apiKey,
          language: 'en',
          sortBy: 'publishedAt',
          from: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // Last 4 days only
          pageSize: Math.min(this.maxResultsPerActivist * 2, 20), // Get more results to filter
          domains: 'bbc.com,reuters.com,ap.org,guardian.com,aljazeera.com,haaretz.com,timesofisrael.com,ynetnews.com' // Focus on reliable sources
        },
        timeout: 10000 // 10 second timeout
      })

      const articles = response.data.articles || []
      
      // Filter and score articles for relevance
      const scoredArticles = articles.map((article: any) => ({
        article,
        score: this.scoreArticleRelevance(article, query)
      })).filter((item: any) => item.score > 0.2) // Lower threshold for recent results
      .sort((a: any, b: any) => b.score - a.score) // Sort by relevance
      .slice(0, this.maxResultsPerActivist) // Take top results

      return scoredArticles.map((item: any) => ({
        title: item.article.title,
        description: item.article.description,
        url: item.article.url,
        publishedAt: item.article.publishedAt,
        source: item.article.source.name
      }))
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.warn('NewsAPI rate limit hit, setting backoff...')
        this.setApiBackoff('NewsAPI', 60) // 1 hour backoff
      } else {
        console.error('NewsAPI error:', error.message)
      }
      return []
    }
  }

  async searchBingNews(query: string): Promise<NewsResult[]> {
    if (!API_CONFIGS.bing.enabled) return []
    
    // Check if API is in backoff period
    if (this.isApiInBackoff('Bing')) {
      return []
    }
    
    // Check if we've hit our API call limit
    if (this.apiCallCount >= this.maxApiCalls) {
      console.warn('⚠️ API call limit reached, skipping Bing')
      return []
    }
    
    this.apiCallCount++

    try {
      const response = await axios.get(API_CONFIGS.bing.baseUrl, {
        headers: {
          'Ocp-Apim-Subscription-Key': API_CONFIGS.bing.apiKey
        },
        params: {
          q: query,
          count: Math.min(this.maxResultsPerActivist * 2, 20), // Get more results to filter
          freshness: 'Day', // Last few days only
          mkt: 'en-US',
          sortBy: 'Date' // Sort by date
        },
        timeout: 10000
      })

      const articles = response.data.value || []
      
      // Filter and score articles for relevance
      const scoredArticles = articles.map((article: any) => ({
        article,
        score: this.scoreArticleRelevance({
        title: article.name,
        description: article.description,
        publishedAt: article.datePublished,
          source: { name: article.provider?.[0]?.name || 'Unknown' }
        }, query)
      })).filter((item: any) => item.score > 0.2) // Lower threshold for recent results
      .sort((a: any, b: any) => b.score - a.score) // Sort by relevance
      .slice(0, this.maxResultsPerActivist) // Take top results

      return scoredArticles.map((item: any) => ({
        title: item.article.name,
        description: item.article.description,
        url: item.article.url,
        publishedAt: item.article.datePublished,
        source: item.article.provider?.[0]?.name || 'Unknown'
      }))
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.warn('Bing News rate limit hit, setting backoff...')
        this.setApiBackoff('Bing', 60) // 1 hour backoff
      } else {
        console.error('Bing News error:', error.message)
      }
      return []
    }
  }

  async searchDuckDuckGo(query: string): Promise<NewsResult[]> {
    try {
      // Use the Python ddgs library for proper DuckDuckGo search
      const { spawn } = require('child_process')
      const path = require('path')
      
      return new Promise((resolve) => {
        const pythonScript = path.join(__dirname, 'duckduckgo-search.py')
        const pythonProcess = spawn('python', [pythonScript, query, '5', 'text'])
        
        let output = ''
        let errorOutput = ''
        
        pythonProcess.stdout.on('data', (data: Buffer) => {
          output += data.toString()
        })
        
        pythonProcess.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString()
        })
        
        let resolved = false
        
        pythonProcess.on('close', async (code: number) => {
          if (resolved) return
          resolved = true
          
          if (code !== 0) {
            console.error(`      ❌ Python script failed with code ${code}: ${errorOutput}`)
            resolve([])
            return
          }
          
          try {
            const results = JSON.parse(output)
            console.log(`      🦆 DuckDuckGo (ddgs) found ${results.length} results`)
            
            // Convert to our format and show results
            const formattedResults: NewsResult[] = []
            
            for (let i = 0; i < Math.min(results.length, 3); i++) {
              const result = results[i]
              console.log(`      🦆 DuckDuckGo Result ${i + 1}: "${result.title}"`)
              console.log(`         URL: ${result.url}`)
              
              // Try to get article content using proper web scraping
              let description = result.description || result.title
              try {
                console.log(`         🔍 Scraping full content with Puppeteer...`)
                const scrapedData = await this.webScraper.scrapeArticle(result.url)
                if (scrapedData.content && scrapedData.content.length > 100) {
                  description = scrapedData.content
                  console.log(`         ✅ Scraped ${scrapedData.wordCount} words: ${scrapedData.content.substring(0, 200)}...`)
                  if (scrapedData.author) {
                    console.log(`         👤 Author: ${scrapedData.author}`)
                  }
                  if (scrapedData.publishedDate) {
                    console.log(`         📅 Published: ${scrapedData.publishedDate}`)
                  }
                } else {
                  console.log(`         ⚠️ Limited content scraped, using fallback`)
                }
              } catch (contentError) {
                console.log(`         ❌ Puppeteer scraping failed, using basic method`)
                // Fallback to basic scraping
                try {
                  const basicContent = await this.scrapeArticleContent(result.url)
                  if (basicContent) {
                    description = basicContent
                    console.log(`         📄 Basic content (${basicContent.length} chars): ${basicContent.substring(0, 200)}...`)
                  }
                } catch (basicError) {
                  console.log(`         ❌ All scraping methods failed`)
                }
              }
              
              formattedResults.push({
                title: result.title,
                description: description,
                url: result.url,
                publishedAt: result.publishedAt || new Date().toISOString(),
                source: result.source || 'DuckDuckGo'
              })
            }
            
            resolve(formattedResults.slice(0, 3))
          } catch (parseError) {
            console.error(`      ❌ Failed to parse Python output: ${parseError}`)
            console.error(`      Raw output: ${output}`)
            resolve([])
          }
        })
        
        // Timeout after 15 seconds (reduced from 30)
        setTimeout(() => {
          if (resolved) return
          resolved = true
          pythonProcess.kill('SIGTERM')
          console.error('      ❌ Python script timed out')
          resolve([])
        }, 15000)
      })
    } catch (error: any) {
      console.error('DuckDuckGo error:', error.message)
      return []
    }
  }

  async searchStartpage(query: string): Promise<NewsResult[]> {
    if (!API_CONFIGS.startpage.enabled) return []
    
    try {
      // Add a small delay to avoid being blocked
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const response = await axios.get(API_CONFIGS.startpage.baseUrl, {
        params: {
          query: query,
          language: 'english',
          cat: 'web',
          pl: 'opensearch'
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      })

      const results: NewsResult[] = []
      const html = response.data
      
      console.log(`      🔍 Startpage HTML response length: ${html.length} characters`)
      
      // Simple regex to find search result links
      const resultRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g
      let match
      let count = 0
      
      while ((match = resultRegex.exec(html)) !== null && count < 5) {
        const url = match[1]
        const title = match[2].replace(/<[^>]*>/g, '').trim()
        
        // Filter out Startpage internal links and empty results
        if (url && title && 
            !url.includes('startpage.com') && 
            !url.startsWith('/') &&
            !url.startsWith('#') &&
            !url.startsWith('javascript:') &&
            title.length > 10 &&
            !title.includes('Startpage')) {
          
          console.log(`      🔍 Startpage Result ${count + 1}: "${title}"`)
          console.log(`         URL: ${url}`)
          
          const result = {
            title: title,
            description: title,
            url: url,
            publishedAt: new Date().toISOString(),
            source: 'Startpage'
          }
          
          results.push(result)
          count++
        }
      }
      
      console.log(`      🔍 Found ${results.length} results from Startpage`)
      return results.slice(0, 3)
    } catch (error: any) {
      console.error('Startpage error:', error.message)
      return []
    }
  }

  async scrapeArticleContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      })
      
      const html = response.data
      
      // Remove script and style tags completely
      let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      cleanHtml = cleanHtml.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      
      // Try multiple content extraction strategies
      let content = ''
      
      // Strategy 1: Look for article tags and main content areas - GET ALL CONTENT
      const articleRegex = /<(article|main|div[^>]*(?:class|id)="[^"]*(?:article|content|post|entry|story)[^"]*")[^>]*>([\s\S]*?)<\/(article|main|div)>/gi
      let articleMatch
      while ((articleMatch = articleRegex.exec(cleanHtml)) !== null && !content) {
        const articleContent = articleMatch[2]
        const paragraphs = articleContent.match(/<p[^>]*>([^<]*)<\/p>/g)
        if (paragraphs) {
          for (const p of paragraphs) { // Remove slice(0, 3) to get ALL paragraphs
            const text = p.replace(/<[^>]*>/g, '').trim()
            if (text.length > 20 && !text.includes('function') && !text.includes('var ') && !text.includes('=>')) {
              content += text + ' '
            }
          }
        }
      }
      
      // Strategy 2: Extract ALL paragraphs and filter out JavaScript
      if (!content) {
        const textRegex = /<p[^>]*>([^<]*)<\/p>/g
        let match
        
        while ((match = textRegex.exec(cleanHtml)) !== null) { // Remove paragraphCount limit
          const paragraph = match[1].replace(/<[^>]*>/g, '').trim()
          
          // Filter out JavaScript and other non-content
          if (paragraph.length > 20 && 
              !paragraph.includes('function') && 
              !paragraph.includes('var ') && 
              !paragraph.includes('=>') &&
              !paragraph.includes('()=>') &&
              !paragraph.includes('async') &&
              !paragraph.includes('await') &&
              !paragraph.match(/^[{}();\s]*$/) &&
              !paragraph.includes('cookie') &&
              !paragraph.includes('privacy') &&
              !paragraph.includes('terms of service')) {
            content += paragraph + ' '
          }
        }
      }
      
      // Strategy 3: Extract ALL text content from divs, spans, and other elements
      if (!content) {
        const allTextRegex = /<(div|span|section|h[1-6])[^>]*>([^<]*)<\/(div|span|section|h[1-6])>/g
        let textMatch
        
        while ((textMatch = allTextRegex.exec(cleanHtml)) !== null) {
          const text = textMatch[2].replace(/<[^>]*>/g, '').trim()
          
          if (text.length > 30 && 
              !text.includes('function') && 
              !text.includes('var ') && 
              !text.includes('=>') &&
              !text.includes('cookie') &&
              !text.includes('privacy') &&
              !text.includes('terms of service') &&
              !text.includes('subscribe') &&
              !text.includes('newsletter')) {
            content += text + ' '
          }
        }
      }
      
      // Strategy 3: Extract from meta description or title if available
      if (!content) {
        const metaDescMatch = cleanHtml.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)
        if (metaDescMatch && metaDescMatch[1].length > 50) {
          content = metaDescMatch[1]
        }
      }
      
      // Clean up the content
      content = content.replace(/\s+/g, ' ').trim()
      
      // Return ALL content (up to 5000 characters to avoid overwhelming the LLM)
      if (content.length > 50) {
        return content.substring(0, 5000) + (content.length > 5000 ? '...' : '')
      }
      
      return ''
    } catch (error) {
      return ''
    }
  }

  async searchEcosia(query: string): Promise<NewsResult[]> {
    if (!API_CONFIGS.ecosia.enabled) return []
    
    try {
      // Add a small delay to avoid being blocked
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const response = await axios.get(API_CONFIGS.ecosia.baseUrl, {
        params: {
          q: query
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://www.ecosia.org/'
        }
      })

      const results: NewsResult[] = []
      const html = response.data
      
      console.log(`      🌱 Ecosia HTML response length: ${html.length} characters`)
      
      // Simple regex to find search result links
      const resultRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g
      let match
      let count = 0
      
      while ((match = resultRegex.exec(html)) !== null && count < 5) {
        const url = match[1]
        const title = match[2].replace(/<[^>]*>/g, '').trim()
        
        // Filter out Ecosia internal links and empty results
        if (url && title && 
            !url.includes('ecosia.org') && 
            !url.startsWith('/') &&
            !url.startsWith('#') &&
            !url.startsWith('javascript:') &&
            title.length > 10 &&
            !title.includes('Ecosia')) {
          
          console.log(`      🌱 Ecosia Result ${count + 1}: "${title}"`)
          console.log(`         URL: ${url}`)
          
          const result = {
            title: title,
            description: title,
            url: url,
            publishedAt: new Date().toISOString(),
            source: 'Ecosia'
          }
          
          results.push(result)
          count++
        }
      }
      
      console.log(`      🌱 Found ${results.length} results from Ecosia`)
      return results.slice(0, 3)
    } catch (error: any) {
      console.error('Ecosia error:', error.message)
      return []
    }
  }

  async searchSearX(query: string): Promise<NewsResult[]> {
    if (!API_CONFIGS.searx.enabled) return []
    
    // Check if API is in backoff period
    if (this.isApiInBackoff('SearX')) {
      return []
    }
    
    // Check if we've hit our API call limit
    if (this.apiCallCount >= this.maxApiCalls) {
      console.warn('⚠️ API call limit reached, skipping SearX')
      return []
    }
    
    this.apiCallCount++

    try {
      // SearX is a free, open-source metasearch engine
      const response = await axios.get(API_CONFIGS.searx.baseUrl, {
        params: {
          q: query,
          format: 'json',
          categories: 'news', // Focus on news results
          time_range: 'week' // Last week
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      const results: NewsResult[] = []
      const data = response.data
      
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach((result: any) => {
          if (result.title && result.url) {
            const newsResult = {
              title: result.title,
              description: result.content || result.title,
              url: result.url,
              publishedAt: result.publishedDate || new Date().toISOString(),
              source: result.engine || 'SearX'
            }
            
            // Only include if relevant
            if (this.scoreArticleRelevance(newsResult, query) > 0.2) {
              results.push(newsResult)
            }
          }
        })
      }

      return results.slice(0, 2) // Limit SearX results
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.status === 429) {
        console.warn('SearX blocked/rate limited, setting backoff...')
        this.setApiBackoff('SearX', 120) // 2 hour backoff for 403 errors
      } else {
        console.error('SearX error:', error.message)
      }
      return []
    }
  }

  generateSearchQueries(activist: { name: string; nationality: string; boatName: string }): string[] {
    const queries = []
    const name = activist.name
    const nationality = activist.nationality
    const boatName = activist.boatName
    
    // Only use the most effective queries to save API calls
    queries.push(`"${name}" detained released flotilla Gaza`)
    queries.push(`"${name}" "${boatName}" released`)
    queries.push(`"${name}" humanitarian flotilla Israel news`)
    
    return queries
  }

  // Generate alternative search strategies for when standard queries fail
  generateAlternativeQueries(activist: { name: string; nationality: string; boatName: string }): string[] {
    const name = activist.name
    const nationality = activist.nationality
    const boatName = activist.boatName
    
    return [
      // Search for the boat name specifically
      `"${boatName}" detained released Gaza`,
      `"${boatName}" humanitarian flotilla`,
      
      // Search by nationality and recent events
      `${nationality} activists Gaza flotilla 2024`,
      `${nationality} humanitarian workers detained`,
      
      // Search for general flotilla news that might mention the activist
      `Gaza flotilla activists detained released`,
      `humanitarian flotilla Gaza activists`,
      
      // Search for recent news about the specific country
      `${nationality} citizens Gaza flotilla`,
      `${nationality} activists Israel detained`
    ]
  }

  async searchForActivist(activist: { id: string; name: string; nationality: string; boatName: string }): Promise<ActivistSearchResult> {
    const searchQueries = this.generateSearchQueries(activist)
    const allResults: NewsResult[] = []
    let successfulQueries = 0
    let totalQueries = 0

    console.log(`🔍 ${activist.name} (${activist.nationality})`)
    
    // Show API status
    const availableApis = []
    if (!this.isApiInBackoff('NewsAPI') && API_CONFIGS.newsapi.enabled) availableApis.push('NewsAPI')
    if (!this.isApiInBackoff('Bing') && API_CONFIGS.bing.enabled) availableApis.push('Bing')
    if (!this.isApiInBackoff('SearX') && API_CONFIGS.searx.enabled) availableApis.push('SearX')
    availableApis.push('DuckDuckGo') // Always available
    
    console.log(`  🔧 Available APIs: ${availableApis.join(', ')}`)

    // Simplified strategy: only try 1-2 most effective queries
    const primaryQueries = searchQueries.slice(0, 2) // Only use top 2 queries
    
    for (const query of primaryQueries) {
      // Check if we've hit API limits
      if (this.apiCallCount >= this.maxApiCalls) {
        console.log(`  ⚠️ API limit reached, stopping search`)
        break
      }
      
      totalQueries++
      console.log(`  🔍 Query ${totalQueries}: "${query}"`)
      
      // Search across multiple APIs
      const [newsapiResults, bingResults, duckduckgoResults, searxResults] = await Promise.all([
        this.searchNewsAPI(query),
        this.searchBingNews(query),
        this.searchDuckDuckGo(query),
        this.searchSearX(query)
      ])

      // If DuckDuckGo didn't find anything, try other search engines as fallback
      let startpageResults: NewsResult[] = []
      let ecosiaResults: NewsResult[] = []
      
      if (duckduckgoResults.length === 0) {
        // Try Startpage first
        startpageResults = await this.searchStartpage(query)
        
        // If Startpage also fails, try Ecosia
        if (startpageResults.length === 0) {
          ecosiaResults = await this.searchEcosia(query)
        }
      }

      // Show what each API returned
      console.log(`    🔍 API Results: NewsAPI(${newsapiResults.length}), Bing(${bingResults.length}), DuckDuckGo(${duckduckgoResults.length}), Startpage(${startpageResults.length}), Ecosia(${ecosiaResults.length}), SearX(${searxResults.length})`)

      const queryResults = [...newsapiResults, ...bingResults, ...duckduckgoResults, ...startpageResults, ...ecosiaResults, ...searxResults]
      
      // Show detailed results for debugging
      if (queryResults.length > 0) {
        console.log(`  📰 Found ${queryResults.length} articles:`)
        queryResults.forEach((article, index) => {
          const score = this.scoreArticleRelevance(article, query)
          console.log(`    ${index + 1}. "${article.title}"`)
          console.log(`       Source: ${article.source}`)
          console.log(`       Score: ${score.toFixed(2)}`)
          console.log(`       URL: ${article.url}`)
        })
      }
      
      // Track query performance
      this.trackQueryPerformance(query, queryResults.length)
      
      if (queryResults.length > 0) {
        successfulQueries++
        allResults.push(...queryResults)
        console.log(`  ✅ Added ${queryResults.length} results`)
        break // Stop after first successful query
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay))
    }

    // Remove duplicates and limit results
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.url === result.url)
    ).slice(0, this.maxResultsPerActivist)

    if (uniqueResults.length > 0) {
      console.log(`  📰 Found ${uniqueResults.length} relevant articles`)
    } else {
      console.log(`  ❌ No relevant articles found`)
    }

    return {
      activistId: activist.id,
      activistName: activist.name,
      nationality: activist.nationality,
      boatName: activist.boatName,
      newsResults: uniqueResults,
      searchQueries: searchQueries.slice(0, totalQueries) // Only return queries we actually used
    }
  }

  async processBatch(activists: any[]): Promise<ActivistSearchResult[]> {
    const results: ActivistSearchResult[] = []
    
    for (const activist of activists) {
      try {
        const result = await this.searchForActivist(activist)
        results.push(result)
        
        // Progress indicator
        console.log(`✅ Processed ${activist.name} - Found ${result.newsResults.length} articles`)
        
      } catch (error) {
        console.error(`❌ Error processing ${activist.name}:`, error)
        results.push({
          activistId: activist.id,
          activistName: activist.name,
          nationality: activist.nationality,
          boatName: activist.boatName,
          newsResults: [],
          searchQueries: []
        })
      }
    }
    
    return results
  }

  async scrapeAllActivists(): Promise<ActivistSearchResult[]> {
    console.log('🚀 Starting bulk news scraping...')
    console.log(`⚙️ API Limits: Max ${this.maxApiCalls} calls, ${this.rateLimitDelay}ms delay`)
    console.log(`📊 Batch size: ${this.batchSize}, Max results per activist: ${this.maxResultsPerActivist}`)
    
    // Show API status
    console.log('\n🔧 API Status:')
    console.log(`  NewsAPI: ${API_CONFIGS.newsapi.enabled ? '✅ Enabled' : '❌ Disabled'}`)
    console.log(`  Bing: ${API_CONFIGS.bing.enabled ? '✅ Enabled' : '❌ Disabled'}`)
    console.log(`  DuckDuckGo: ✅ Always Available`)
    console.log(`  SearX: ${API_CONFIGS.searx.enabled ? '✅ Enabled' : '❌ Disabled'}`)
    console.log('')
    
    // Get all activists from database
    const activists = await prisma.activist.findMany({
      select: {
        id: true,
        name: true,
        nationality: true,
        boatName: true
      }
    })

    console.log(`📊 Found ${activists.length} activists to process`)

    const allResults: ActivistSearchResult[] = []
    
    // Process in batches
    for (let i = 0; i < activists.length; i += this.batchSize) {
      const batch = activists.slice(i, i + this.batchSize)
      const batchNum = Math.floor(i / this.batchSize) + 1
      const totalBatches = Math.ceil(activists.length / this.batchSize)
      
      console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} activists)`)
      
      const batchResults = await this.processBatch(batch)
      const batchWithResults = batchResults.filter(r => r.newsResults.length > 0)
      
      if (batchWithResults.length > 0) {
        console.log(`✅ ${batchWithResults.length}/${batch.length} activists have recent news`)
      } else {
        console.log(`❌ No recent news found for this batch`)
      }
      
      allResults.push(...batchResults)
      
      // Longer delay between batches
      if (i + this.batchSize < activists.length) {
        await new Promise(resolve => setTimeout(resolve, 3000)) // Reduced to 3 seconds
      }
    }

    console.log(`\n🎉 Scraping complete! Processed ${allResults.length} activists`)
    console.log(`📊 API Usage: ${this.apiCallCount}/${this.maxApiCalls} calls used`)
    
    // Show search analytics
    this.getSearchAnalytics()
    
    return allResults
  }

  async cleanup(): Promise<void> {
    await this.webScraper.close()
  }
}

// Main execution function
async function main() {
  const scraper = new NewsScraper()
  
  try {
    const results = await scraper.scrapeAllActivists()
    
    // Save results to file for LLM processing
    const fs = require('fs')
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `scraped-news-${timestamp}.json`
    
    fs.writeFileSync(filename, JSON.stringify(results, null, 2))
    console.log(`💾 Results saved to ${filename}`)
    
    // Summary statistics
    const totalArticles = results.reduce((sum, result) => sum + result.newsResults.length, 0)
    const activistsWithNews = results.filter(result => result.newsResults.length > 0).length
    
    console.log(`\n📈 Summary:`)
    console.log(`  - Total activists processed: ${results.length}`)
    console.log(`  - Activists with news found: ${activistsWithNews}`)
    console.log(`  - Total articles found: ${totalArticles}`)
    
  } catch (error) {
    console.error('❌ Scraping failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { NewsScraper }
export type { ActivistSearchResult, NewsResult }
