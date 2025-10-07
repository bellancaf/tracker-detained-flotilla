#!/usr/bin/env tsx

import puppeteer, { Browser, Page } from 'puppeteer'

export class WebScraper {
  private browser: Browser | null = null

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      })
    }
  }

  async scrapeArticle(url: string): Promise<{
    title: string
    content: string
    author?: string
    publishedDate?: string
    wordCount: number
  }> {
    if (!this.browser) {
      await this.initialize()
    }

    const page = await this.browser!.newPage()
    
    try {
      // Set user agent and viewport
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      await page.setViewport({ width: 1920, height: 1080 })

      // Navigate to the page
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      })

      // Wait for content to load and handle common blockers
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Try to dismiss common popups and consent dialogs
      try {
        const consentSelectors = [
          'button[class*="accept"]',
          'button[class*="consent"]', 
          'button[class*="agree"]',
          'button[class*="allow"]',
          'button[class*="continue"]',
          '[data-testid*="accept"]',
          '.cookie-consent button',
          '#cookie-consent button',
          '.gdpr-consent button',
          'button:contains("Accept")',
          'button:contains("Agree")',
          'button:contains("Continue")'
        ]

        for (const selector of consentSelectors) {
          try {
            const button = await page.$(selector)
            if (button) {
              await button.click()
              await new Promise(resolve => setTimeout(resolve, 1000))
              break
            }
          } catch (e) {
            // Ignore click errors
          }
        }
      } catch (e) {
        // Ignore popup dismissal errors
      }

      // Extract article data
      const articleData = await page.evaluate(() => {
        // Remove unwanted elements
        const unwantedSelectors = [
          'script', 'style', 'nav', 'header', 'footer', 
          '.advertisement', '.ads', '.sidebar', '.comments',
          '.social-share', '.newsletter', '.cookie-banner',
          '[class*="ad-"]', '[id*="ad-"]', '[class*="popup"]',
          '[class*="modal"]', '[class*="overlay"]'
        ]
        
        unwantedSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector)
          elements.forEach(el => el.remove())
        })

        // Try to find the main content
        const contentSelectors = [
          'article',
          'main',
          '[role="main"]',
          '.article-content',
          '.post-content',
          '.entry-content',
          '.content',
          '.story-content',
          '.article-body',
          '.post-body',
          '.entry-body'
        ]

        let mainContent = ''
        let title = ''
        let author = ''
        let publishedDate = ''

        // Extract title
        const titleSelectors = [
          'h1',
          '.article-title',
          '.post-title',
          '.entry-title',
          '.headline',
          'title'
        ]

        for (const selector of titleSelectors) {
          const titleEl = document.querySelector(selector)
          if (titleEl && titleEl.textContent) {
            title = titleEl.textContent.trim()
            break
          }
        }

        // Extract author
        const authorSelectors = [
          '.author',
          '.byline',
          '.article-author',
          '.post-author',
          '[rel="author"]',
          '[class*="author"]'
        ]

        for (const selector of authorSelectors) {
          const authorEl = document.querySelector(selector)
          if (authorEl && authorEl.textContent) {
            author = authorEl.textContent.trim()
            break
          }
        }

        // Extract published date
        const dateSelectors = [
          'time[datetime]',
          '.published-date',
          '.post-date',
          '.article-date',
          '[class*="date"]',
          '[class*="time"]'
        ]

        for (const selector of dateSelectors) {
          const dateEl = document.querySelector(selector)
          if (dateEl) {
            const dateText = dateEl.getAttribute('datetime') || dateEl.textContent
            if (dateText) {
              publishedDate = dateText.trim()
              break
            }
          }
        }

        // Extract main content
        for (const selector of contentSelectors) {
          const contentEl = document.querySelector(selector)
          if (contentEl) {
            // Get all text content from paragraphs, headings, and divs
            const textElements = contentEl.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, span')
            const textParts: string[] = []
            
            textElements.forEach(el => {
              const text = el.textContent?.trim()
              if (text && text.length > 20) {
                // Filter out navigation, ads, and other non-content
                const lowerText = text.toLowerCase()
                const badPhrases = [
                  'cookie', 'privacy', 'consent', 'subscribe', 'newsletter',
                  'terms of service', 'advertising', 'personalized', 'tracking',
                  'data protection', 'gdpr', 'accept all', 'manage preferences',
                  'help us verify', 'automated access', 'commercial use',
                  'follow us', 'share this', 'advertisement', 'function',
                  'var ', 'javascript', 'enable javascript', 'browser',
                  'microsoft cares', 'news group newspapers', 'automated means'
                ]
                
                const isBadContent = badPhrases.some(phrase => lowerText.includes(phrase)) ||
                                   text.match(/^[{}();\s]*$/) ||
                                   text.length < 20 ||
                                   text.split('.').length < 2
                
                if (!isBadContent) {
                  textParts.push(text)
                }
              }
            })
            
            if (textParts.length > 0) {
              mainContent = textParts.join(' ')
              break
            }
          }
        }

        // If no main content found, try to get all text from body
        if (!mainContent) {
          const bodyText = document.body.textContent
          if (bodyText) {
            mainContent = bodyText.replace(/\s+/g, ' ').trim()
          }
        }

        return {
          title,
          content: mainContent,
          author,
          publishedDate,
          wordCount: mainContent.split(/\s+/).length
        }
      })

      return articleData

    } catch (error) {
      console.error(`Error scraping ${url}:`, error)
      return {
        title: '',
        content: '',
        wordCount: 0
      }
    } finally {
      await page.close()
    }
  }

  async scrapeMultipleArticles(urls: string[]): Promise<Array<{
    url: string
    title: string
    content: string
    author?: string
    publishedDate?: string
    wordCount: number
    success: boolean
  }>> {
    const results = []
    
    for (const url of urls) {
      try {
        console.log(`  📄 Scraping: ${url}`)
        const articleData = await this.scrapeArticle(url)
        
        results.push({
          url,
          ...articleData,
          success: articleData.content.length > 100
        })
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`  ❌ Failed to scrape ${url}:`, error)
        results.push({
          url,
          title: '',
          content: '',
          wordCount: 0,
          success: false
        })
      }
    }
    
    return results
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}
