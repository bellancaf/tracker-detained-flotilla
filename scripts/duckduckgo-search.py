#!/usr/bin/env python3

import sys
import json
from ddgs import DDGS

def search_duckduckgo(query, max_results=5):
    """Search DuckDuckGo using the ddgs library"""
    try:
        # Initialize DDGS with proper settings
        ddgs = DDGS(timeout=20)
        
        # Search for text results with news focus
        results = []
        for result in ddgs.text(query, max_results=max_results, timelimit='w'):  # Last week
            # Filter for news-like results
            url = result.get('href', '')
            title = result.get('title', '')
            
            # Skip non-news domains
            if any(domain in url.lower() for domain in [
                'dedeman', 'construction', 'shopping', 'ecommerce', 'wellness', 
                'ivxhealth', 'adventhealth', 'seasidewellness', 'infusion',
                'medical', 'health', 'therapy', 'treatment', 'clinic'
            ]):
                continue
                
            # Prefer news domains
            news_domains = [
                'news', 'times', 'independent', 'guardian', 'bbc', 'cnn', 'reuters', 
                'ap.org', 'msn.com', 'thesun', 'irishtimes', 'irishexaminer', 
                'echolive', 'hotpress', 'pressreader', 'thejournal', 'extra.ie',
                'citizen.co.za', 'middleeasteye', 'palestinechronicle', 'joburgetc',
                'brittlepaper', 'agi.it', 'ilmanifesto', 'italia-informa'
            ]
            
            if any(domain in url.lower() for domain in news_domains):
                results.append({
                    'title': title,
                    'description': result.get('body', ''),
                    'url': url,
                    'source': 'DuckDuckGo News'
                })
            else:
                # Only include non-news domains if they seem relevant to the query
                if any(keyword in title.lower() or keyword in result.get('body', '').lower() 
                       for keyword in ['flotilla', 'gaza', 'israel', 'detained', 'released', 'activist']):
                    results.append({
                        'title': title,
                        'description': result.get('body', ''),
                        'url': url,
                        'source': 'DuckDuckGo'
                    })
        
        return results
        
    except Exception as e:
        print(f"Error searching DuckDuckGo: {e}", file=sys.stderr)
        return []

def search_news(query, max_results=5):
    """Search DuckDuckGo news using the ddgs library"""
    try:
        # Initialize DDGS with proper settings
        ddgs = DDGS(timeout=20)
        
        # Search for news results
        results = []
        for result in ddgs.news(query, max_results=max_results):
            results.append({
                'title': result.get('title', ''),
                'description': result.get('body', ''),
                'url': result.get('url', ''),
                'source': 'DuckDuckGo News',
                'publishedAt': result.get('date', '')
            })
        
        return results
        
    except Exception as e:
        print(f"Error searching DuckDuckGo news: {e}", file=sys.stderr)
        return []

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python duckduckgo-search.py <query> [max_results] [type]")
        sys.exit(1)
    
    query = sys.argv[1]
    max_results = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    search_type = sys.argv[3] if len(sys.argv) > 3 else 'text'
    
    if search_type == 'news':
        results = search_news(query, max_results)
    else:
        # Try news search first, then fallback to general search
        results = search_news(query, max_results)
        if len(results) < 2:  # If not enough news results, try general search
            general_results = search_duckduckgo(query, max_results)
            results.extend(general_results)
    
    # Output results as JSON
    print(json.dumps(results, indent=2))
