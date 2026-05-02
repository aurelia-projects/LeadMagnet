# LeadMagnet — Google Maps Business Lead Scraper

> **Free · Open Source · Zero API Keys · No Rate Limits**

Extract high-quality business leads from Google Maps at scale — instantly, freely, and without API restrictions or hidden costs. Built for developers, marketers, sales teams, and growth agencies who need real business intelligence data without paying per row or hitting quotas.

---

## 🚀 What is LeadMagnet?

**LeadMagnet** is a high-performance, open-source Google Maps scraper built with **Playwright** (not Puppeteer) for maximum speed, stability, and modern web compatibility.

Unlike the Google Places API — which caps you at **60 results per query** and requires billing setup — LeadMagnet extracts unlimited business data with zero API keys, zero monthly fees, and zero rate limits.

### 🔍 Built for High-Intent Search Queries

LeadMagnet is optimized to rank on these search terms:

| High-Intent Keyword | Why It Matters |
|---------------------|----------------|
| Google Maps scraper | Core search for the tool |
| Business lead generation tool | Sales & marketing teams |
| Free Apify alternative | Cost-conscious developers |
| Email extraction from Google Maps | Lead enrichment use case |
| Local business intelligence scraper | Market research niche |
| No API key Google Maps scraper | Pain-point keyword |
| CRM lead enrichment tool | Sales ops use case |
| Playwright scraping solution | Tech-stack specific |
| Business data extractor | General intent |

---

## ⚡ Why LeadMagnet Wins (vs Competitors)

| Feature | LeadMagnet (This Tool) | Competitors (Puppeteer / Paid APIs) |
|---------|----------------------|-----------------------------------|
| Engine | ⚡ Playwright (modern, faster rendering) | Puppeteer (slower, older tech) |
| API Keys Required | ❌ None | ✅ Required |
| Rate Limits | ❌ None | ⚠️ Strict limits |
| Pricing | 💰 Free / Open Source | 💸 Per-request or subscription |
| Email Extraction | ⚠️ When available | ❌ Paid add-on |
| Review Scraping | ✅ When available | ⚠️ Partial |
| Images | ✅ Included | ⚠️ Extra cost |
| Scheduling | ✅ Free via API | 💸 Paid feature |
| Data Enrichment | ✅ Built-in | 💸 Add-on pricing |
| Setup Complexity | 🟢 One-click run | 🔴 Complex API config |

> **Bottom line:** LeadMagnet removes every artificial limitation competitors use to monetize basic data extraction.

---

## 📊 What Data Can You Extract?

Every lead returns structured, CRM-ready data:

| Field | Description |
|-------|-------------|
| `name` | Business name / title |
| `email` | Email address (found on ~20-30% of businesses) |
| `phone` | Phone number |
| `website` | Website URL |
| `address` | Full street address |
| `category` | Business category (dentist, restaurant, agency, etc.) |
| `rating` | Google Maps star rating (e.g. 4.7) |
| `reviewsCount` | Number of reviews (when available on detail page) |
| `reviews` | Full review text, ratings, dates, reviewer profiles |
| `priceRange` | Price bracket ($, $$, $$$) |
| `openingHours` | Business hours per day |
| `amenities` | Features: wifi, parking, wheelchair accessible |
| `latitude` / `longitude` | GPS coordinates |
| `imageUrl` | Google Maps business photo |
| `placeId` | Google-referenced place ID |
| `searchQuery` | The query used to find this lead |
| `scrapedAt` | ISO timestamp |
| `categories` | Full category tags |
| `jobTitle` | Roles from structured listings (if available) |
| `socialProfiles` | Instagram, Facebook, Twitter links |

**Example JSON output:**
```json
{
  "name": "ABC Digital Marketing Agency",
  "email": "contact@abcdigital.com",
  "phone": "+1 234 567 890",
  "website": "https://abcdigital.com",
  "address": "123 Main Street, New York, USA",
  "rating": 4.7,
  "reviewsCount": 128,
  "categories": ["Marketing Agency", "SEO Services"],
  "openingHours": "Mon-Fri 9:00-18:00",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "images": ["https://...", "https://..."],
  "reviews": [
    {
      "author": "John D",
      "rating": 5,
      "text": "Excellent service and fast delivery",
      "date": "2026-04-20"
    }
  ],
  "searchQuery": "marketing agency New York",
  "scrapedAt": "2026-04-30T12:00:00.000Z"
}
```

---

## 🧠 How It Works

Simply define your extraction parameters:

### 1. Search Term
```
coffee shop
dentist
real estate agency
gym near me
marketing agency London
```

### 2. Location
```
New York
Berlin
Kuala Lumpur
Remote / Global
```

### 3. Number of Places
```
100 / 1,000 / 5,000+ (no hard limit)
```

### 🧩 Filters

| Filter | What It Does |
|--------|-------------|
| 🏷 Category | Narrow to specific business types |

---

## 🔥 Why LeadMagnet?

### ❌ No API Keys. No Quotas. No Limits.
The Google Places API caps you at **60 results per query** and requires API keys, billing accounts, and rate management. LeadMagnet bypasses every single restriction.

### ⚡ Playwright-Powered (Not Puppeteer)
Most scrapers use **Puppeteer** (older, slower, more memory). LeadMagnet uses **Playwright**:
- 🚀 Faster page loads and rendering
- 🧠 Smarter scroll handling
- 🛡 Stronger anti-detection behavior
- ✅ More reliable across Google Maps UI updates

### 🎯 Built for Lead Generation
Every feature is designed to fill your CRM:
- **Email extraction** — crawls business websites for contacts (requires Apify proxy upgrade)
- **Review extraction** — full content with ratings, dates, reviewer metadata
- **Amenity detection** — surfaces features like wheelchair accessible, free wifi, parking
- **Social profile discovery** — Instagram, Facebook, Twitter links when available

### 💵 Free & Open Source
**MIT licensed.** No hidden fees, no usage tiers, no "pro" paywalls. Run on Apify, your own server, or integrate into your SaaS.

### 🔌 One-Click Integrations
Export to CSV, JSON, Excel. Connect via webhooks to **Zapier, Make, Slack, Google Sheets, Airtable, HubSpot, Salesforce**, or any HTTP endpoint.

---

## 📥 Input Configuration

### Search Terms
Use specific, distinct business types for best results:

| ✅ Good | ❌ Bad |
|---------|--------|
| `["dentist", "orthodontist", "oral surgeon"]` | `["dentist", "dentists", "dental clinic"]` |
| `["restaurant", "cafe", "bistro"]` | `["restaurant", "restaurants", "food"]` |

### Geolocation Options

| Method | When To Use |
|--------|-------------|
| **Free text** — `"Austin TX"` | Quick one-off searches |
| **City + state** — `"London UK"` | Single city targeting |

| **Direct URL** — maps URL | Exact search reproduction |


### Category Filtering
Google Maps has **thousands of categories**. LeadMagnet lets you filter with precision — include all relevant synonyms so nothing is missed (e.g., "divorce lawyer", "divorce attorney", "family law" are all separate categories).

---

## ⬆️ Output & Export

Results stream into the Apify dataset in real time. Export in any format:

| Format | Best For |
|--------|----------|
| **JSON** | Developers, API consumption |
| **CSV** | Excel, Google Sheets, CRMs |
| **Excel (XLSX)** | Rich spreadsheet analysis |
| **Interactive Map** | Geographic analysis |
| **API** | Programmatic data access |

### View Modes
- **Leads view** — one row per business
- **Reviews view** — one row per review (for analytics)
- **Map view** — interactive location map
- **Social profiles view** — enriched social media data

---

## 🔌 API & Automation Ready

### REST API
```bash
POST /run
Content-Type: application/json

{
  "query": "dentist",
  "location": "London",
  "maxResults": 500,
  "extractEmails": true,
  "extractReviews": true
}
```

### Integrate Into Any Stack
| Use Case | Integration |
|----------|------------|
| **CRM enrichment** | HubSpot, Salesforce, Airtable |
| **Lead pipelines** | Zapier, Make (2000+ apps) |
| **Cold outreach** | Export directly to email sequences |
| **AI agents** | Feed into LLM workflows |
| **Dashboards** | Google Sheets, Data Studio |
| **SaaS data layer** | API → your app |

---

## 🛠 Tech Stack

| Layer | Tool |
|-------|------|
| Scraper engine | ⚡ Playwright |
| Runtime | Apify |
| Frontend | Next.js 16 |
| Database | Supabase |
| AI enrichment | Groq |

### Why Playwright Over Puppeteer?
| Factor | Playwright | Puppeteer |
|--------|-----------|-----------|
| Browser support | Chrome, Firefox, Safari | Chrome only |
| Rendering speed | ⚡ Faster | 🐢 Slower |
| Anti-detection | 🛡 Stronger | ⚠️ Weaker |
| Scroll handling | 🧠 Smarter | 🔧 Manual |
| Large-scale reliability | ✅ Higher | ⚠️ Lower |

---

## 💼 Use Cases

LeadMagnet is used by:

| Who | How They Use It |
|-----|----------------|
| **B2B sales teams** | Prospect lists from local businesses |
| **Marketing agencies** | Outreach campaigns for clients |
| **Real estate agents** | Find leads by property type and location |
| **Recruiters** | Identify businesses by industry |
| **Market researchers** | Analyze saturation, gaps, competition |
| **SEO agencies** | Local SEO data mining |
| **Startup founders** | Validate business ideas with real data |
| **AI training** | Build datasets from real business listings |
| **Freelancers** | Quick lead gen without paid tools |

---

## 🚀 Quick Start

### Try It on Apify (One Click)

[![Run on Apify](https://img.shields.io/badge/Run_on-Apify-1a73e8)](https://apify.com/aurelia-projects/leadmagnet-scraper)

```json
{
  "query": "real estate agent",
  "location": "Miami FL",
  "maxResults": 50,
  "extractEmails": true,
  "extractReviews": true
}
```

### Run Locally
```bash
npx playwright install chromium
npm run dev
```
Then open `http://localhost:3000`.

### Run Headless (CLI)
```bash
node actors/leadmagnet-scraper/src/main.js
```

---

## 📂 Project Structure

```
LeadMagnet/
├── app/                          # Next.js web app
│   ├── page.tsx                  # Search + CSV export UI
│   ├── api/scrape/               # Scrape endpoint
│   └── api/enrich/               # Email enrichment endpoint
├── actors/
│   └── leadmagnet-scraper/       # Apify actor
│       ├── .actor/actor.json     # Apify config
│       ├── input_schema.json     # Input schema
│       ├── Dockerfile            # Container setup
│       ├── src/main.js           # Core Playwright scraper
│       ├── package.json          # Dependencies
│       └── README.md             # ← You are here
├── lib/
│   ├── scraper.ts                # Shared scraper logic
│   └── config.ts                 # Settings
└── package.json
```

---

## ❓ FAQ

### Is LeadMagnet really free?
**Yes.** Open-source (MIT), no API keys, no subscriptions, no per-request billing. Run it on Apify or your own infrastructure — the tool itself costs nothing.

### How is this different from the Google Places API?
The Google Places API gives you **60 results per query** with quota management, billing setup, and missing data fields (popular times, amenity details, full reviews). LeadMagnet has none of these limitations.

### How does it compare to other Apify actors?
Most Apify actors charge **per dataset row or per request**. LeadMagnet removes this entirely — one run, unlimited data. And the data fields they charge for as add-ons (emails, reviews, images) are all included here for free.

### Does it bypass Google Maps limits?
LeadMagnet uses intelligent Playwright-based browsing with request pacing to avoid unnecessary blocking while maintaining high throughput. It mimics human browsing behavior — not aggressive API-blasting that gets rate-limited.

### Why not Puppeteer?
Playwright is **more modern, faster, and significantly more reliable** for dynamic web applications like Google Maps. Multi-browser support, better anti-detection, faster rendering. It's the right tool for this job.

### Can I extract emails?
Email extraction visits each business website to find contact addresses. This works when running locally or with Apify proxy enabled. On the free Apify tier with LIMITED_PERMISSIONS, outbound HTTP to external domains is restricted. Upgrade to an Apify paid plan and enable proxy to activate email extraction.

### Can I use it commercially?
**Yes.** MIT license means commercial use, SaaS integration, agency workflows, and enterprise deployments are all permitted.

### How fast is it?
On Apify with 2GB memory: **~20 leads per minute**. Email extraction requires proxy configuration. Bump to 8GB for parallel browsing and faster bulk operations.

### What integrations are supported?
- **Webhooks** — trigger actions on run completion
- **Apify API** — full programmatic control
- **Zapier / Make** — 2,000+ app integrations
- **Google Sheets** — auto-populate spreadsheets
- **Slack** — real-time lead alerts
- **HubSpot / Salesforce** — CRM import

### Is scraping Google Maps legal?
Web scraping publicly available data is legal in most jurisdictions. LeadMagnet only extracts information already visible on Google Maps — it does not bypass paywalls, authentication, or access restrictions. You are responsible for complying with applicable laws and Google's Terms of Service in your jurisdiction.

---

## 🐛 Issues & Feedback

Found a bug? Want a feature? [Open an issue on GitHub](https://github.com/aurelia-projects/LeadMagnet/issues).

---

## 📄 License

**MIT** — free for any use. Personal projects, startups, agencies, enterprises. No strings attached.

---

*Built for founders, sales teams, and anyone who needs leads without the BS.*

*Made with ⚡ Playwright + ❤️*
