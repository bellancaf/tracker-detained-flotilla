# Bulk News Update System

This system automatically scrapes news about detained activists and uses AI to generate structured updates for admin review.

## 🎯 Overview

The bulk news update system consists of three main components:

1. **News Scraper** - Searches multiple free APIs for recent news about activists
2. **LLM Processor** - Uses OpenAI to analyze news and extract status updates
3. **Admin Review** - Enhanced admin interface for bulk approval/rejection

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `env.example` to `.env.local` and add your API keys:

```bash
cp env.example .env.local
```

**Required:**
- `OPENAI_API_KEY` - Your OpenAI API key for LLM processing

**Optional (for more news sources):**
- `NEWSAPI_KEY` - Free from [NewsAPI.org](https://newsapi.org/) (1000 requests/day)
- `BING_SEARCH_KEY` - Free from [Azure](https://azure.microsoft.com/en-us/services/cognitive-services/bing-web-search-api/) (1000 requests/month)

### 3. Run the System

```bash
# Test run (no API calls, no data saved)
npm run bulk-news-update:dry

# Full run (processes up to 50 activists)
npm run bulk-news-update

# Process specific number of activists
npm run bulk-news-update -- --max-activists 20
```

## 📊 How It Works

### Phase 1: News Scraping
- Searches for recent news (last 14 days) about each activist
- Uses multiple free APIs to maximize coverage
- Generates smart search queries combining name, nationality, and boat name
- Rate limits requests to respect API limits

### Phase 2: LLM Processing
- Analyzes scraped news articles with GPT-3.5-turbo
- Extracts potential status updates (released, detained, transferred, etc.)
- Assigns confidence levels (high, medium, low)
- Generates structured descriptions for admin review

### Phase 3: Admin Review
- Auto-generated submissions appear in admin panel with 🤖 badge
- Bulk selection and approval/rejection
- Approved updates become timeline events
- Rejected updates are discarded

## 💰 Cost Control

The system is designed to be cost-effective:

- **Free APIs**: Uses DuckDuckGo (unlimited) + optional free tiers
- **Smart Batching**: Processes activists in small batches
- **Conservative LLM Usage**: Only processes activists with found news
- **Cost Estimation**: Shows estimated OpenAI costs before processing

**Typical costs:**
- 50 activists ≈ $0.03-0.05 in OpenAI API costs
- Free APIs have generous limits for regular use

## 🔧 Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...                    # OpenAI API key

# Optional (for more news sources)
NEWSAPI_KEY=...                          # NewsAPI.org key
BING_SEARCH_KEY=...                      # Bing Search API key
```

### Command Line Options

```bash
npm run bulk-news-update [options]

Options:
  --dry-run              Test run without API calls
  --max-activists N      Limit number of activists (default: 50)
  --help                 Show help message
```

## 📁 File Structure

```
scripts/
├── bulk-news-scraper.ts          # News scraping logic
├── llm-news-processor.ts         # LLM processing pipeline
├── run-bulk-news-update.ts       # Main orchestration script
└── ...

app/api/admin/submissions/bulk/   # Bulk submission API
components/AdminSubmissions.tsx   # Enhanced admin interface
```

## 🎛️ Admin Interface

The admin interface has been enhanced with:

- **Auto-Generated Badge**: 🤖 identifies system-generated submissions
- **Bulk Selection**: Checkbox selection for multiple submissions
- **Bulk Actions**: Approve/reject multiple submissions at once
- **Smart Filtering**: Shows count of auto-generated vs manual submissions

## 📈 Monitoring & Results

### Output Files
- `scraped-news-YYYY-MM-DD.json` - Raw scraping results
- `processed-updates-YYYY-MM-DD.json` - LLM-processed updates

### Console Output
- Real-time progress indicators
- Cost estimates
- Summary statistics
- Error handling and retry logic

### Database
- All updates saved as `pending` submissions
- Admin can review and approve/reject
- Approved updates become timeline events

## 🛠️ Troubleshooting

### Common Issues

**"No activists to process"**
- System only processes activists not checked in last 7 days
- Focuses on detained/unknown status activists
- Increase `--max-activists` if needed

**"API rate limit exceeded"**
- System includes built-in rate limiting
- Wait and retry, or reduce batch size
- Check your API key limits

**"OpenAI API error"**
- Verify your API key is valid
- Check you have sufficient credits
- Try reducing batch size with `--max-activists`

### Debug Mode

Run with dry-run to test without API calls:

```bash
npm run bulk-news-update:dry
```

## 🔄 Regular Usage

### Recommended Schedule
- **Daily**: Run for 20-30 activists (quick check)
- **Weekly**: Full run for all activists
- **As needed**: After major news events

### Best Practices
1. Start with dry-run to test configuration
2. Use smaller batches initially to test costs
3. Review auto-generated submissions carefully
4. Monitor API usage and costs
5. Keep API keys secure and rotate regularly

## 🚨 Important Notes

- **Cost Control**: Always test with `--dry-run` first
- **API Limits**: Respect free tier limits to avoid charges
- **Data Quality**: LLM results need human review
- **Privacy**: System only searches public news sources
- **Accuracy**: Conservative approach - better to miss updates than create false ones

## 📞 Support

If you encounter issues:
1. Check the console output for error messages
2. Verify your environment variables
3. Test with `--dry-run` first
4. Check API key validity and limits
5. Review the generated JSON files for debugging

The system is designed to be robust and cost-effective while providing valuable updates about detained activists.
