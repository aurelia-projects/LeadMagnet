# LeadMagnet 🔥

**Google Maps Business Lead Scraper** — free, open source, no API keys needed.

Scrape business leads from Google Maps: names, phones, websites, emails, addresses, ratings, reviews. Export to CSV. Run on Apify or your own server.

## Quick Start

```bash
npx playwright install chromium
npm run dev
```

Then visit `http://localhost:3000`, enter a business type + location, click Search.

## Apify Actor

[![LeadMagnet on Apify](https://img.shields.io/badge/Apify-LeadMagnet-1a73e8)](https://apify.com/aurelia-projects/leadmagnet-scraper)

The Apify actor runs headless Chromium and outputs structured data:

**Input:** `{ "query": "dentists", "location": "Austin TX", "maxResults": 20, "extractEmails": true }`

**Output:** JSON array with `name`, `category`, `address`, `phone`, `website`, `email`, `rating`, `reviews`, `searchQuery`, `scrapedAt`.

## Tech Stack

| Layer | Tool | Cost |
|-------|------|------|
| Scraper | Playwright | Free |
| Runtime | Apify / Node.js | Free ($5/mo compute) |
| Frontend | Next.js 16 | Free (Vercel) |
| Database | Supabase | Free (500MB) |
| Cache | Upstash Redis | Free (500K cmd/mo) |
| AI | Groq | Free (14K req/day) |
| Queue | QStash | Free (10K req/mo) |

## Project Structure

```
LeadMagnet/
├── app/                    # Next.js web app
│   ├── page.tsx           # Search UI + CSV export
│   ├── api/scrape/        # Scrape endpoint
│   └── api/enrich/        # Email enrichment
├── actors/
│   └── leadmagnet-scraper/ # Apify actor
│       ├── src/main.js     # Actor code
│       ├── .actor/actor.json
│       ├── input_schema.json
│       └── Dockerfile
├── lib/
│   ├── scraper.ts          # Core Playwright scraper
│   └── config.ts          # Settings
└── package.json
```

## License

MIT — free for any use.
