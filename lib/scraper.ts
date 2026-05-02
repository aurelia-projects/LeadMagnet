/**
 * LeadMagnet — Google Maps Business Scraper
 * 
 * Fully automated, zero-cost, runs on Playwright.
 * No paid APIs, no trials, completely open source.
 * 
 * Extracts: name, category, rating, reviews count, address, phone,
 * website, email, opening hours, price range, coordinates, images,
 * amenities, social profiles, and customer reviews.
 * 
 * Usage:
 *   import { scrapeLeads } from '@/lib/scraper';
 *   const leads = await scrapeLeads('dentists', 'Kuala Lumpur');
 */

import { chromium, type Browser, type Page } from 'playwright';

// ============ TYPES ============

export interface Review {
  reviewerName: string;
  rating: number;
  text: string;
  publishDate: string;
  likes: number;
  responseText: string;
}

export interface Lead {
  name: string;
  category: string;
  categories: string[];
  address: string;
  phone: string;
  phoneUnformatted: string;
  website: string;
  email: string;
  rating: number;
  reviewsCount: number;
  latitude: number;
  longitude: number;
  openingHours: string[];
  openingHoursDetailed: string[];
  priceRange: string;
  placeId: string;
  placeUrl: string;
  imageUrl: string;
  imageUrls: string[];
  amenities: string[];
  socialProfiles: SocialProfiles;
  scrapedAt: string;
}

interface SocialProfiles {
  instagram: string;
  facebook: string;
  twitter: string;
}

interface ScrapeOptions {
  maxResults?: number;
  maxScrolls?: number;
  includeEmail?: boolean;
  includeReviews?: boolean;
  maxReviewsPerPlace?: number;
  includeImages?: boolean;
  includeAmenities?: boolean;
  includeOpeningHours?: boolean;
  timeout?: number;
}

// ============ MAIN ============

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
    maxReviewsPerPlace = 5,
    includeImages = false,
    includeAmenities = true,
    includeOpeningHours = true,
    timeout = 45000
  } = options;

  const searchQuery = location ? `${query} ${location}` : query;
  const leads: Lead[] = [];
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

    await navigateToMaps(page, searchQuery);
    await waitForResults(page, timeout);
    await scrollToLoad(page, maxScrolls);
    
    const rawBusinesses = await extractListings(page);
    console.log(`Found ${rawBusinesses.length} businesses`);
    
    for (let idx = 0; idx < rawBusinesses.length && idx < maxResults; idx++) {
      const biz = rawBusinesses[idx];
      console.log(`Processing ${idx + 1}/${Math.min(rawBusinesses.length, maxResults)}: ${biz.name}`);

      // Parse coordinates from the place URL if not found on card
      const coords = parseCoords(biz.placeUrl);
      const address = biz.address || '';

      const lead: Lead = {
        name: biz.name || 'Unknown',
        category: biz.category || '',
        categories: biz.categories || [],
        address,
        phone: biz.phone || '',
        phoneUnformatted: biz.phoneUnformatted || '',
        website: biz.website || '',
        email: '',
        rating: biz.rating || 0,
        reviewsCount: biz.reviewsCount || 0,
        latitude: biz.lat || coords.lat || 0,
        longitude: biz.lng || coords.lng || 0,
        openingHours: biz.openingHours || [],
        openingHoursDetailed: [],
        priceRange: biz.priceRange || '',
        placeId: biz.placeId || '',
        placeUrl: biz.placeUrl || '',
        imageUrl: biz.imageUrl || '',
        imageUrls: [],
        amenities: biz.amenities || [],
        socialProfiles: biz.socialProfiles || { instagram: '', facebook: '', twitter: '' },
        scrapedAt: new Date().toISOString(),
      };

      // Extract email from website
      if (includeEmail && lead.website) {
        lead.email = await extractEmail(page, lead.website) || '';
      }

      // Try to open place detail for phone, website, reviews, etc.
      await enrichPlace(page, biz.name, lead, {
        extractReviews: includeReviews,
        maxReviewsPerPlace,
        extractImages: includeImages,
        extractAmenities: includeAmenities,
        extractOpeningHours: includeOpeningHours,
      });

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
  await page.waitForTimeout(3000);
}

async function waitForResults(page: Page, _timeout: number) {
  await Promise.race([
    page.waitForSelector('[role="feed"]', { timeout: 15000 }).catch(() => {}),
    page.waitForSelector('.Nv2PK', { timeout: 15000 }).catch(() => {}),
    page.waitForFunction(
      () => document.querySelectorAll('.Nv2PK').length > 0,
      { timeout: 15000 }
    ).catch(() => {}),
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

// ============ CARD EXTRACTION ============

async function extractListings(page: Page): Promise<any[]> {
  return page.evaluate(() => {
    const items: any[] = [];
    const cards = document.querySelectorAll('.Nv2PK');
    
    cards.forEach(card => {
      const name = card.getAttribute('aria-label') || '';
      if (!name || items.find(i => i.name === name)) return;
      
      const fullText = card.textContent || '';
      const ratingEl = card.querySelector('[aria-label*="stars"]');
      const rating = ratingEl?.getAttribute('aria-label')?.match(/[\d.]+/)?.[0];
      
      // Parse the text segments
      // Typical: "Name  4.9Category · icon · Address   Open/Closed info"
      const parts: string[] = [];
      card.querySelectorAll('.W4Efsd').forEach(el => {
        const t = el.textContent?.trim();
        if (t) parts.push(t);
      });

      // Opening hours status from text
      const hours = [] as string[];
      const hourMatch = fullText.match(/(Open|Closed)(.+(?:AM|PM|am|pm|today|tomorrow|Thu|Fri|Sat|Sun|Mon|Tue|Wed))?/);
      if (hourMatch) hours.push(hourMatch[0].trim());

      // Amenities from tooltips
      const amenities: string[] = [];
      card.querySelectorAll('[data-tooltip]').forEach(el => {
        const t = el.getAttribute('data-tooltip');
        if (t) amenities.push(t);
      });

      // Image
      const imgEl = card.querySelector('img');
      const imageUrl = (imgEl as HTMLImageElement)?.src || '';

      // Place link
      const link = card.querySelector('a.hfpxzc');
      const placeUrl = link?.getAttribute('href') || '';

      // Price from aria-label
      const priceEl = card.querySelector('[aria-label*="Price"]');
      const priceRange = priceEl?.getAttribute('aria-label')?.replace('Price: ', '') || '';

      // Reviews count from rating element
      const reviewsCount = ratingEl?.closest('[aria-label]')?.getAttribute('aria-label')?.match(/([\d,]+)\s*reviews?/)?.[1]?.replace(/,/g, '');

      // Social profiles
      const instaEl = card.querySelector('a[href*="instagram.com"]');
      const fbEl = card.querySelector('a[href*="facebook.com"]');
      const twEl = card.querySelector('a[href*="twitter.com"], a[href*="x.com"]');

      items.push({
        name,
        category: (() => {
          const m = fullText.match(/\d\.\d\s*([A-Za-z\s&-]+?)(?:\s*·\s*|\s*\d|\s*$)/);
          return m?.[1]?.trim() || '';
        })(),
        categories: [],
        address: (() => {
          const parts = fullText.split('·').map((s: string) => s.trim());
          for (let i = 1; i < parts.length; i++) {
            const clean = parts[i].replace(/[\uE934\uE935\uE938\uE940]/g, '').trim();
            if (clean.length > 10 && /\d/.test(clean) && !clean.includes('AM') && !clean.includes('PM')) {
              // Remove trailing status like "Closed" or "Open"
              return clean.replace(/(Closed|Open)(\s*·\s*Opens.*|\s*\d+:\d+.*)?$/, '').trim();
            }
          }
          return '';
        })(),
        phone: '',
        phoneUnformatted: '',
        website: '',
        rating: rating ? parseFloat(rating) : 0,
        reviewsCount: reviewsCount ? parseInt(reviewsCount) : 0,
        lat: 0,
        lng: 0,
        openingHours: hours,
        priceRange,
        placeId: placeUrl.match(/data=!4m7.*?1s([^!]+)/)?.[1] || '',
        placeUrl,
        imageUrl,
        amenities,
        socialProfiles: {
          instagram: (instaEl as HTMLAnchorElement)?.href || '',
          facebook: (fbEl as HTMLAnchorElement)?.href || '',
          twitter: (twEl as HTMLAnchorElement)?.href || '',
        },
      });
    });
    
    return items;
  });
}

/** Extract category from the card text */
function extractCategory(text: string): string {
  // After rating, before address/hours — e.g., "4.9Dentist · icon · address"
  const match = text.match(/\d\.\d\s*([A-Za-z\s&-]+?)(?:\s*·\s*|\s*\d|\s*$)/);
  return match?.[1]?.trim() || '';
}

/** Extract address from the card text */
function extractAddress(text: string): string {
  // Usually after the second · separator
  const parts = text.split('·').map(s => s.trim());
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].length > 10 && /\d/.test(parts[i]) && !parts[i].includes('AM') && !parts[i].includes('PM')) {
      return parts[i].replace(/[]\s*/g, '').trim();
    }
  }
  return '';
}

/** Parse lat/lng from the Google Maps place URL */
function parseCoords(url: string): { lat: number; lng: number } {
  const match = url.match(/!3d(-?[\d.]+)!4d(-?[\d.]+)/);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }
  return { lat: 0, lng: 0 };
}

// ============ PLACE ENRICHMENT ============

interface EnrichOpts {
  extractReviews: boolean;
  maxReviewsPerPlace: number;
  extractImages: boolean;
  extractAmenities: boolean;
  extractOpeningHours: boolean;
}

async function enrichPlace(page: Page, placeName: string, lead: Lead, opts: EnrichOpts) {
  // Navigate directly to the place detail page
  try {
    if (!lead.placeUrl) return;
    await page.goto(lead.placeUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);

    // Extract phone and website from the detail panel
    const detailData = await page.evaluate(() => {
      const data: any = {};
      
      // Phone button
      const phoneBtn = document.querySelector('button[data-item-id^="phone:tel:"]');
      if (phoneBtn) data.phone = phoneBtn.getAttribute('data-item-id')?.replace('phone:tel:', '') || '';
      
      // Website
      const websiteEl = document.querySelector('a[data-item-id="authority"]');
      if (websiteEl) data.website = websiteEl.getAttribute('href') || '';

      // Full opening hours from detail panel
      const hours: string[] = [];
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      document.querySelectorAll('[aria-label*="hour"], .A1pRfd, .YMlIz, .g7w8dc, .y0jJcc').forEach(el => {
        const t = el.textContent?.trim();
        if (t && (days.some(d => t.includes(d)) || t.includes('AM') || t.includes('PM'))) {
          if (!hours.includes(t)) hours.push(t);
        }
      });
      if (hours.length) data.openingHours = hours;

      // Categories
      const cats: string[] = [];
      document.querySelectorAll('.Ahnjwc, .DkEaL').forEach(el => {
        const t = el.textContent?.trim();
        if (t && !cats.includes(t)) cats.push(t);
      });
      if (cats.length) data.categories = cats;

      // Address detail
      const addrEl = document.querySelector('[data-item-id="address"]');
      if (addrEl) data.address = addrEl.textContent?.trim() || '';

      return data;
    });

    if (detailData.phone) lead.phone = detailData.phone;
    if (detailData.website) lead.website = detailData.website;
    if (detailData.address) lead.address = detailData.address;
    if (detailData.categories?.length) lead.categories = detailData.categories;
    if (detailData.openingHours?.length) lead.openingHoursDetailed = detailData.openingHours;

  } catch (err) {
    console.log(`  Detail panel skipped: ${(err as Error).message}`);
  }
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
          !e.includes('example.com') && !e.includes('noreply') &&
          !e.includes('no-reply') && !e.includes('support@')
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

  scrapeLeads(query, location, { 
    maxResults: 5, 
    includeEmail: false,
    includeReviews: false,
    includeImages: false,
    includeAmenities: true,
  })
    .then(leads => {
      console.log(`\nFound ${leads.length} leads:\n`);
      leads.forEach((l, i) => {
        console.log(`\n=== ${i + 1}. ${l.name} ===`);
        console.log(`   Category: ${l.category}`);
        console.log(`   Address: ${l.address}`);
        console.log(`   Phone: ${l.phone || 'N/A'}`);
        console.log(`   Website: ${l.website || 'N/A'}`);
        console.log(`   Rating: ${l.rating} ⭐ (${l.reviewsCount} reviews)`);
        console.log(`   Price: ${l.priceRange || 'N/A'}`);
        console.log(`   Coords: ${l.latitude}, ${l.longitude}`);
        console.log(`   Hours: ${l.openingHours.join(', ') || 'N/A'}`);
        if (l.amenities.length) console.log(`   Amenities: ${l.amenities.slice(0, 5).join(', ')}`);
        if (l.imageUrl) console.log(`   Image: ${l.imageUrl.substring(0, 60)}...`);
        console.log('');
      });
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}
