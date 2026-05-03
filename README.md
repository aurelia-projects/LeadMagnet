# LeadMagnet 🔥 — Google Maps Business Lead Scraper

> **Free · Open Source · Zero API Keys · No Rate Limits**

Scrape business leads from Google Maps at scale — names, phones, websites, addresses, ratings, reviews, coordinates, opening hours, and more. Export to CSV, JSON, Excel, or any CRM. Run on Apify with one click or deploy yourself.

[![Run on Apify](https://img.shields.io/badge/Run_on-Apify-1a73e8)](https://apify.com/zakbuildsai/leadmagnet)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Why LeadMagnet?

| Feature | LeadMagnet | Competitors |
|---------|-----------|-------------|
| Engine | ⚡ Playwright (faster, modern) | Puppeteer (older, slower) |
| API Keys | ❌ None required | ✅ Required |
| Rate Limits | ❌ None | ⚠️ Strict quotas |
| Email Extraction | ⚠️ When available (proxy required) | ❌ Paid add-on |
| Reviews Scraping | ✅ When available | ⚠️ Partial / extra cost |
| Price | 💰 Free / Open Source | 💸 Per-request or subscription |
| Setup | 🟢 One-click on Apify | 🔴 Complex config |

---

## Quick Start

### One-Click on Apify
[Run on Apify](https://apify.com/zakbuildsai/leadmagnet) — enter a business type and location:

```json
{ "query": "dentist", "location": "Austin TX", "maxResults": 50 }
```

### Run Locally
```bash
npx playwright install chromium
npm run dev
```
Open `http://localhost:3000`, enter a business type + location, click Search.

---

## What You Can Extract

📛 Business names · 📞 Phone numbers · 🌐 Websites · ✉️ Emails (when available)
📍 Full addresses · 🗺 GPS coordinates · ⭐ Ratings · 📊 Review count (when available)
💬 Full reviews (text, dates, profiles) · 🏷 Categories · 💲 Price range
🕒 Opening hours · ♿ Amenities (wifi, parking, wheelchair) · 📸 Images
🔗 Place IDs · 📱 Social profiles (Instagram, Facebook, Twitter)

---

## 🔌 API & Integrations

Export to **CSV, JSON, Excel, or API**. Connect with **Zapier, Make, Slack, Google Sheets, Airtable, HubSpot, Salesforce**, or any HTTP endpoint via webhooks.

**API Example:**
```bash
POST /run
{ "query": "real estate agent", "location": "Miami", "maxResults": 100 }
```

---

## 🛠 Tech Stack

| Layer | Tool |
|-------|------|
| Scraper engine | ⚡ Playwright |
| Runtime | Apify |
| Frontend | Next.js |
| Database | Supabase |

---

## Use Cases

- **B2B lead generation** — prospect lists for sales outreach
- **Agency campaigns** — local business data for clients
- **Market research** — saturation analysis, service gaps
- **SEO data mining** — local SEO competitive intelligence
- **CRM enrichment** — fill missing contacts
- **AI training datasets** — real business listing data

---

## Project Structure

```
LeadMagnet/
├── app/                         # Next.js web app
│   ├── page.tsx                 # Search UI + CSV export
│   ├── api/scrape/              # Scrape endpoint
│   └── api/enrich/              # Email enrichment
├── actors/
│   └── leadmagnet-scraper/      # Apify actor
│       ├── src/main.js          # Core Playwright scraper
│       ├── .actor/actor.json
│       ├── input_schema.json
│       ├── Dockerfile
│       └── README.md            # Full docs with FAQ
├── lib/
│   ├── scraper.ts
│   └── config.ts
└── package.json
```

Full Apify actor documentation → [`actors/leadmagnet-scraper/README.md`](actors/leadmagnet-scraper/README.md)

---

## Notes

- **Email extraction:** Requires Apify paid plan with proxy enabled. On the free tier, outbound HTTP to external domains is blocked by LIMITED_PERMISSIONS. Disabled by default.

- **Reviews count:** Extracted from the Google Maps detail page when available. May be null for some businesses.

---

## License

**MIT** — free for any use. Personal, commercial, agency, enterprise.
