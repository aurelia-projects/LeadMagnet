/**
 * LeadMagnet — Apify Actor
 * Google Maps Business Lead Scraper
 * 
 * Free, open source. No API keys needed.
 * https://github.com/aurelia-projects/LeadMagnet
 */

import { Actor } from 'apify';
import { chromium } from 'playwright';

await Actor.init();

const {
  query,
  location = '',
  maxResults = 20,
  extractEmails = true,
} = await Actor.getInput() || {};

if (!query) {
  throw new Error('Business type (query) is required');
}

const searchQuery = location ? `${query} ${location}` : query;
const leads = [];

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });

  // Navigate to Google Maps
  const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}/`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for results
  await Promise.race([
    page.waitForSelector('[role="feed"]', { timeout: 15000 }).catch(() => {}),
    page.waitForSelector('.Nv2PK', { timeout: 15000 }).catch(() => {}),
  ]);

  // Scroll to load results
  for (let i = 0; i < 10 && leads.length < maxResults; i++) {
    await page.evaluate(() => {
      const feed = document.querySelector('[role="feed"]');
      if (feed) feed.scrollBy(0, feed.scrollHeight);
    });
    await page.waitForTimeout(2000);

    // Extract businesses after each scroll
    const businesses = await page.evaluate(() => {
      const items = [];
      const cards = document.querySelectorAll('[role="feed"] > div > div[jsaction], .Nv2PK, [role="article"]');
      
      cards.forEach(card => {
        const nameEl = card.querySelector('.fontHeadlineSmall, .qBF1Pd, h3');
        if (!nameEl?.textContent) return;

        const name = nameEl.textContent.trim();
        if (items.find(i => i.name === name)) return;

        const categoryEl = card.querySelector('.fontBodyMedium .Ahnjwc, .W4Efsd');
        const addressEl = card.querySelector('[data-item-id="address"]');
        const phoneEl = card.querySelector('[data-item-id*="phone"]');
        const websiteEl = card.querySelector('[data-item-id*="website"], a[href*="website"]');
        const ratingEl = card.querySelector('.MW4etd, span[aria-label*="stars"]');
        const reviewsEl = card.querySelector('.UY7F9, span[aria-label*="review"]');

        items.push({
          name,
          category: categoryEl?.textContent?.trim() || '',
          address: addressEl?.textContent?.trim() || '',
          phone: phoneEl?.textContent?.trim() || phoneEl?.getAttribute('data-phone') || '',
          website: websiteEl?.textContent?.trim() || websiteEl?.getAttribute('href') || '',
          rating: ratingEl?.textContent?.trim() || '',
          reviews: reviewsEl?.textContent?.trim()?.replace(/[^0-9]/g, '') || '',
        });
      });

      return items;
    });

    // Add new unique results
    for (const biz of businesses) {
      if (!leads.find(l => l.name === biz.name)) {
        leads.push(biz);
      }
    }
  }

  // Extract emails if enabled
  if (extractEmails) {
    const progress = Actor.createProgress({ title: 'Extracting emails' });
    
    for (let i = 0; i < leads.length && i < maxResults; i++) {
      const lead = leads[i];
      progress.set({ message: `${i + 1}/${Math.min(leads.length, maxResults)}: ${lead.name}` });

      if (lead.website && !lead.website.includes('google.com')) {
        try {
          const emailPage = await browser.newPage();
          await emailPage.goto(lead.website, { waitUntil: 'domcontentloaded', timeout: 15000 });

          const email = await emailPage.evaluate(() => {
            const text = document.body?.innerText || '';
            const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            
            // Also check mailto links
            const mailto = document.querySelector('a[href^="mailto:"]');
            const mailtoEmail = mailto?.getAttribute('href')?.replace('mailto:', '');
            
            const found = match ? match[0].toLowerCase() : null;
            if (found && !found.includes('example.com') && !found.includes('noreply')) {
              return found;
            }
            return mailtoEmail?.toLowerCase() || null;
          });

          if (email) lead.email = email;
          await emailPage.close();
        } catch {
          // Website didn't load, skip
        }
      }
    }
  }

} catch (err) {
  console.error('Scrape failed:', err);
  throw err;
} finally {
  await browser.close();
}

// Push results to Apify dataset
const results = leads.slice(0, maxResults);
for (const lead of results) {
  await Actor.pushData({
    name: lead.name,
    category: lead.category || null,
    address: lead.address || null,
    phone: lead.phone || null,
    website: lead.website || null,
    email: lead.email || null,
    rating: lead.rating ? parseFloat(lead.rating) : null,
    reviews: lead.reviews ? parseInt(lead.reviews) : null,
    searchQuery,
    scrapedAt: new Date().toISOString(),
  });
}

console.log(`✅ Scraped ${results.length} leads for "${searchQuery}"`);

await Actor.exit();
