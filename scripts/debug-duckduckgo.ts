#!/usr/bin/env tsx

import axios from 'axios'

async function testDuckDuckGo() {
  console.log('🔍 Testing DuckDuckGo manually...')
  
  const query = 'Tadhg Hickey detained released flotilla Gaza'
  const url = `https://duckduckgo.com/html?q=${encodeURIComponent(query)}`
  
  console.log(`📡 Requesting: ${url}`)
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 10000
    })
    
    const html = response.data
    console.log(`📊 Response length: ${html.length} characters`)
    console.log(`📊 Status: ${response.status}`)
    console.log(`📊 Headers:`, response.headers)
    
    // Check if it's the homepage
    if (html.includes('Search the web without being tracked')) {
      console.log('❌ Got homepage - DuckDuckGo is blocking us!')
    } else if (html.includes('result__a') || html.includes('result__title')) {
      console.log('✅ Got search results!')
      
      // Try to extract some results
      const resultRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g
      let match
      let count = 0
      
      while ((match = resultRegex.exec(html)) !== null && count < 3) {
        const url = match[1]
        const title = match[2].replace(/<[^>]*>/g, '').trim()
        
        if (url && title && 
            !url.includes('duckduckgo.com') && 
            !url.startsWith('/') &&
            title.length > 10) {
          console.log(`  ${count + 1}. "${title}"`)
          console.log(`     URL: ${url}`)
          count++
        }
      }
    } else {
      console.log('❓ Unknown response format')
      console.log(`First 1000 chars: ${html.substring(0, 1000)}`)
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.response) {
      console.error(`Status: ${error.response.status}`)
      console.error(`Headers:`, error.response.headers)
    }
  }
}

testDuckDuckGo().catch(console.error)
