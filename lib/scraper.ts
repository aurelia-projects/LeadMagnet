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
  scrapedAt: string;
}

interface ScrapeOptions {
  maxResults?: number;
  maxScrolls?: number;
  includeEmail?: boolean;
  timeout?: number;
}

/**
 * Scrape business leads from Google Maps
 * 
 * @param query - Business type (e.g., "dentists")
 * @param location - Location (e.g., "Kuala Lumpur")
 * @param options - Optional settings
 * @returns Array of enriched business leads
 */
export async function scrapeLeads(
  query: string,
  location: string = '',
  options: ScrapeOptions = {}
): Promise<Lead[]> {
  const {
    maxResults = 100,
    maxScrolls = 8,
    includeEmail = true,
    timeout = 45000
  } = options;

  const searchQuery = location ? `${query} ${location}` : query;
  const leads: Lead[] = [];
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    
    // Set realistic headers to avoid detection
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
        scrapedAt: new Date().toISOString(),
      };

      // Enrich: extract email from website if available
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

// ============ PRIVATE HELPERS ============

async function launchBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
    ],
  });
}

async function navigateToMaps(page: Page, query: string) {
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/`;
  await page.goto(url, { 
    waitUntil: 'domcontentloaded',
    timeout: 30000 
  });
}

async function waitForResults(page: Page, timeout: number) {
  // Wait for either the feed or any result card to appear
  await Promise.race([
    page.waitForSelector('[role="feed"]', { timeout: 15000 }).catch(() => {}),
    page.waitForSelector('.Nv2PK', { timeout: 15000 }).catch(() => {}),
    page.waitForFunction(() => {
      return document.querySelectorAll('[role="article"]').length > 0;
    }, { timeout: 15000 }).catch(() => {}),
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
      if (feed) {
        feed.scrollBy(0, feed.scrollHeight);
      }
    });

    // Wait for new results to load
    await page.waitForTimeout(2500);

    const newHeight = await page.evaluate(() => {
      const feed = document.querySelector('[role="feed"]');
      return feed ? feed.scrollHeight : 0;
    });

    if (newHeight <= previousHeight) {
      break; // No more results loading
    }
  }
}

async function extractBusinesses(page: Page): Promise<any[]> {
  return page.evaluate(() => {
    const items: any[] = [];
    
    // Try multiple selectors for robustness
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
      const addressEl = card.querySelector('[data-item-id="address"], .W4Efsd + .W4Efsd');
      const phoneEl = card.querySelector('[data-item-id*="phone"]');
      const websiteEl = card.querySelector('[data-item-id*="website"], a[href*="website"]');
      const ratingEl = card.querySelector('.MW4etd, span[aria-label*="stars"]');
      const reviewsEl = card.querySelector('.UY7F9, span[aria-label*="review"]');
      const coordsEl = card.querySelector('[data-lat]');

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
        });
      }
    });

    return items;
  });
}

async function extractEmail(page: Page, websiteUrl: string): Promise<string | null> {
  if (!websiteUrl || websiteUrl.includes('google.com')) return null;

  try {
    const emailPage = await page.context().newPage();
    await emailPage.goto(websiteUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });

    // Try multiple techniques to find email
    const email = await emailPage.evaluate(() => {
      const text = document.body?.innerText || '';
      
      // Find email addresses in the page text
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = text.match(emailRegex);
      
      if (matches) {
        // Filter out common false positives
        const valid = matches.filter(e => 
          !e.includes('example.com') && 
          !e.includes('@domain.com') &&
          !e.includes('@email.com') &&
          !e.includes('@your') &&
          !e.includes('@your-') &&
          !e.includes('noreply') &&
          !e.includes('no-reply') &&
          !e.includes('support@') &&
          !e.startsWith('info') === false
        );
        
        // Return first real-looking email
        const realEmails = valid.filter(e => !e.match(/^(noreply|no-reply|support|admin|webmaster)/));
        return realEmails.length > 0 ? realEmails[0].toLowerCase() : null;
      }
      
      // Also check mailto: links
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
    return null; // Website didn't load, skip email
  }
}

/**
 * Run scrape from command line
 */
if (require.main === module) {
  const [,, query, location] = process.argv;
  if (!query) {
    console.error('Usage: npx tsx lib/scraper.ts "dentists" "Kuala Lumpur"');
    process.exit(1);
  }

  scrapeLeads(query, location, { maxResults: 20 })
    .then(leads => {
      console.log(`\nFound ${leads.length} leads:\n`);
      leads.forEach((l, i) => {
        console.log(`${i + 1}. ${l.name}`);
        console.log(`   ${l.category} | ${l.phone}`);
        console.log(`   ${l.email || 'no email'}`);
        console.log(`   ${l.website || 'no website'}`);
        console.log('');
      });
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}
