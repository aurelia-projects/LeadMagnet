/**
 * LeadMagnet — Google Maps Business Scraper
 * 
 * Fully automated, zero-cost, runs on Playwright.
 * No paid APIs, no trials, completely open source.
 * 
 * Usage:
 *   import { scrapeLeads } from '@/lib/scraper';
 *   const leads = await scrapeLeads('dentists', 'Kuala Lumpur');
 */

import { chromium, type Browser, type Page } from 'playwright';

export interface Lead {
  name: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  rating: string;
  reviews: string;
  latitude: number;
  longitude: number;
  openingHours: string[];
  priceRange: string;
  placeId: string;
  socialProfiles: {
    instagram: string;
    facebook: string;
    twitter: string;
  };
  scrapedAt: string;
}

interface ScrapeOptions {
  maxResults?: number;
  maxScrolls?: number;
  includeEmail?: boolean;
  includeReviews?: boolean;
  includeOpeningHours?: boolean;
  timeout?: number;
}

export async function scrapeLeads(
  query: string,
  location: string = '',
  options: ScrapeOptions = {}
): Promise<Lead[]> {
  const {
    maxResults = 100,
    maxScrolls = 8,
    includeEmail = true,
    includeReviews = false,
    includeOpeningHours = true,
    timeout = 45000
  } = options;

  const searchQuery = location ? `${query} ${location}` : query;
  const leads: Lead[] = [];
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    await navigateToMaps(page, searchQuery);
    await waitForResults(page, timeout);
    await scrollToLoad(page, maxScrolls);
    
    const rawBusinesses = await extractBusinesses(page);
    
    for (const biz of rawBusinesses.slice(0, maxResults)) {
      const lead: Lead = {
        name: biz.name || 'Unknown',
        category: biz.category || '',
        address: biz.address || '',
        phone: biz.phone || '',
        website: biz.website || '',
        email: '',
        rating: biz.rating || '',
        reviews: biz.reviews || '',
        latitude: biz.lat || 0,
        longitude: biz.lng || 0,
        openingHours: biz.openingHours || [],
        priceRange: biz.priceRange || '',
        placeId: biz.placeId || '',
        socialProfiles: biz.socialProfiles || { instagram: '', facebook: '', twitter: '' },
        scrapedAt: new Date().toISOString(),
      };

      // Extract email from website
      if (includeEmail && lead.website) {
        lead.email = await extractEmail(page, lead.website) || '';
      }

      leads.push(lead);
    }

  } catch (err) {
    console.error('Scrape failed:', err);
    throw err;
  } finally {
    await browser.close();
  }

  return leads;
}

// ============ BROWSER ============

async function launchBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', '--disable-gpu', '--single-process',
    ],
  });
}

async function navigateToMaps(page: Page, query: string) {
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
}

async function waitForResults(page: Page, timeout: number) {
  await Promise.race([
    page.waitForSelector('[role="feed"]', { timeout: 15000 }).catch(() => {}),
    page.waitForSelector('.Nv2PK', { timeout: 15000 }).catch(() => {}),
    page.waitForFunction(() => document.querySelectorAll('[role="article"]').length > 0, { timeout: 15000 }).catch(() => {}),
  ]);
}

async function scrollToLoad(page: Page, maxScrolls: number) {
  for (let i = 0; i < maxScrolls; i++) {
    const previousHeight = await page.evaluate(() => {
      const feed = document.querySelector('[role="feed"]');
      return feed ? feed.scrollHeight : 0;
    });
    await page.evaluate(() => {
      const feed = document.querySelector('[role="feed"]');
      if (feed) feed.scrollBy(0, feed.scrollHeight);
    });
    await page.waitForTimeout(2500);
    const newHeight = await page.evaluate(() => {
      const feed = document.querySelector('[role="feed"]');
      return feed ? feed.scrollHeight : 0;
    });
    if (newHeight <= previousHeight) break;
  }
}

// ============ EXTRACTION ============

async function extractBusinesses(page: Page): Promise<any[]> {
  return page.evaluate(() => {
    const items: any[] = [];

    const selectors = [
      '[role="feed"] > div > div[jsaction]',
      '.Nv2PK',
      '[role="article"]',
      '.m6QErb section',
    ];

    let cards: NodeListOf<Element> | Element[] = [];
    for (const selector of selectors) {
      cards = document.querySelectorAll(selector);
      if (cards.length > 0) break;
    }

    cards.forEach(card => {
      const nameEl = card.querySelector('.fontHeadlineSmall, .qBF1Pd, h3, .lI9IFe');
      const categoryEl = card.querySelector('.fontBodyMedium .Ahnjwc, .W4Efsd');
      const addressEl = card.querySelector('[data-item-id="address"]');
      const phoneEl = card.querySelector('[data-item-id*="phone"]');
      const websiteEl = card.querySelector('[data-item-id*="website"], a[href*="website"]');
      const ratingEl = card.querySelector('.MW4etd, span[aria-label*="stars"]');
      const reviewsEl = card.querySelector('.UY7F9, span[aria-label*="review"]');
      const coordsEl = card.querySelector('[data-lat]');
      const priceEl = card.querySelector('[aria-label*="Price"]');
      const placeIdEl = card.querySelector('[data-place-id]');

      // Opening hours — the status text shows operating hours
      const hours: string[] = [];
      const statusEl = card.querySelector('.W4Efsd, .ZDu9vd, .A1pRfd');
      if (statusEl) {
        const statusText = statusEl.textContent?.trim();
        if (statusText && (statusText.includes('Open') || statusText.includes('Closed') || statusText.includes('Closes'))) {
          hours.push(statusText);
        }
      }

      // Social profiles
      const instaEl = card.querySelector('a[href*="instagram.com"]');
      const fbEl = card.querySelector('a[href*="facebook.com"]');
      const twEl = card.querySelector('a[href*="twitter.com"], a[href*="x.com"]');

      const name = nameEl?.textContent?.trim();
      if (name && !items.find(i => i.name === name)) {
        items.push({
          name,
          category: categoryEl?.textContent?.trim() || '',
          address: addressEl?.textContent?.trim() || '',
          phone: phoneEl?.textContent?.trim() || phoneEl?.getAttribute('data-phone') || '',
          website: websiteEl?.textContent?.trim() || websiteEl?.getAttribute('href') || '',
          rating: ratingEl?.textContent?.trim() || '',
          reviews: reviewsEl?.textContent?.trim()?.replace(/[^0-9]/g, '') || '',
          lat: parseFloat(coordsEl?.getAttribute('data-lat') || '0'),
          lng: parseFloat(coordsEl?.getAttribute('data-lng') || '0'),
          openingHours: hours,
          priceRange: priceEl?.getAttribute('aria-label')?.replace('Price: ', '') || '',
          placeId: placeIdEl?.getAttribute('data-place-id') || '',
          socialProfiles: {
            instagram: (instaEl as HTMLAnchorElement)?.href || '',
            facebook: (fbEl as HTMLAnchorElement)?.href || '',
            twitter: (twEl as HTMLAnchorElement)?.href || '',
          },
        });
      }
    });

    return items;
  });
}

// ============ EMAIL EXTRACTION ============

async function extractEmail(page: Page, websiteUrl: string): Promise<string | null> {
  if (!websiteUrl || websiteUrl.includes('google.com')) return null;

  try {
    const emailPage = await page.context().newPage();
    await emailPage.goto(websiteUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const email = await emailPage.evaluate(() => {
      const text = document.body?.innerText || '';
      
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = text.match(emailRegex);
      
      if (matches) {
        const realEmails = matches.filter(e => 
          !e.includes('example.com') && 
          !e.includes('noreply') &&
          !e.includes('no-reply') &&
          !e.includes('support@')
        );
        if (realEmails.length > 0) return realEmails[0].toLowerCase();
      }
      
      const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
      if (mailtoLinks.length > 0) {
        const href = mailtoLinks[0].getAttribute('href');
        if (href) return href.replace('mailto:', '').toLowerCase();
      }
      
      return null;
    });

    await emailPage.close();
    return email;
  } catch {
    return null;
  }
}

// ============ CLI ============

if (require.main === module) {
  const [,, query, location] = process.argv;
  if (!query) {
    console.error('Usage: npx tsx lib/scraper.ts "dentists" "Kuala Lumpur"');
    process.exit(1);
  }

  scrapeLeads(query, location, { maxResults: 20, includeEmail: false })
    .then(leads => {
      console.log(`\nFound ${leads.length} leads:\n`);
      leads.forEach((l, i) => {
        console.log(`${i + 1}. ${l.name}`);
        console.log(`   ${l.category} | ${l.phone}`);
        console.log(`   Price: ${l.priceRange || 'N/A'}`);
        console.log(`   Hours: ${l.openingHours.slice(0, 3).join(', ') || 'N/A'}`);
        if (l.socialProfiles.instagram) console.log(`   Instagram: ${l.socialProfiles.instagram}`);
        console.log('');
      });
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}
