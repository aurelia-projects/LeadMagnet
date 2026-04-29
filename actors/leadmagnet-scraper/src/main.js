/**
 * LeadMagnet — Apify Actor
 * Google Maps Business Lead Scraper
 * 
 * Free, open source. No API keys needed.
 * Version 0.2.0 — Now with opening hours, price range, and social profiles.
 */

import { Actor } from 'apify';
import { chromium } from 'playwright';

await Actor.init();

const {
  query,
  location = '',
  maxResults = 20,
  extractEmails = true,
  includeOpeningHours = true,
  includeReviews = false,
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
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

  const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}/`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  await Promise.race([
    page.waitForSelector('[role="feed"]', { timeout: 15000 }).catch(() => {}),
    page.waitForSelector('.Nv2PK', { timeout: 15000 }).catch(() => {}),
  ]);

  // Scroll and extract
  for (let i = 0; i < 10 && leads.length < maxResults; i++) {
    await page.evaluate(() => {
      const feed = document.querySelector('[role="feed"]');
      if (feed) feed.scrollBy(0, feed.scrollHeight);
    });
    await page.waitForTimeout(2000);

    const businesses = await page.evaluate((includeOpeningHours) => {
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
        const priceEl = card.querySelector('[aria-label*="Price"]');
        const coordsEl = card.querySelector('[data-lat]');
        const placeIdEl = card.querySelector('[data-place-id]');
        const instaEl = card.querySelector('a[href*="instagram.com"]');
        const fbEl = card.querySelector('a[href*="facebook.com"]');
        const twEl = card.querySelector('a[href*="twitter.com"], a[href*="x.com"]');

        // Opening hours
        const hours = [];
        if (includeOpeningHours) {
          const hoursEls = card.querySelectorAll('.A1pRfd, .YMlIz, .g7w8dc, .y0jJcc');
          hoursEls.forEach(h => { const t = h.textContent?.trim(); if (t) hours.push(t); });
        }

        items.push({
          name,
          category: categoryEl?.textContent?.trim() || '',
          address: addressEl?.textContent?.trim() || '',
          phone: phoneEl?.textContent?.trim() || phoneEl?.getAttribute('data-phone') || '',
          website: websiteEl?.textContent?.trim() || websiteEl?.getAttribute('href') || '',
          rating: ratingEl?.textContent?.trim() || '',
          reviews: reviewsEl?.textContent?.trim()?.replace(/[^0-9]/g, '') || '',
          priceRange: priceEl?.getAttribute('aria-label')?.replace('Price: ', '') || '',
          lat: parseFloat(coordsEl?.getAttribute('data-lat') || '0'),
          lng: parseFloat(coordsEl?.getAttribute('data-lng') || '0'),
          placeId: placeIdEl?.getAttribute('data-place-id') || '',
          openingHours: hours,
          socialProfiles: {
            instagram: (instaEl)?.href || '',
            facebook: (fbEl)?.href || '',
            twitter: (twEl)?.href || '',
          },
        });
      });
      return items;
    }, includeOpeningHours);

    for (const biz of businesses) {
      if (!leads.find(l => l.name === biz.name)) {
        leads.push(biz);
      }
    }
  }

  // Extract emails
  if (extractEmails) {
    for (let i = 0; i < leads.length && i < maxResults; i++) {
      const lead = leads[i];
      console.log(`Email: ${i + 1}/${Math.min(leads.length, maxResults)}: ${lead.name}`);

      if (lead.website && !lead.website.includes('google.com')) {
        try {
          const emailPage = await browser.newPage();
          await emailPage.goto(lead.website, { waitUntil: 'domcontentloaded', timeout: 15000 });
          const email = await emailPage.evaluate(() => {
            const text = document.body?.innerText || '';
            const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            const mailto = document.querySelector('a[href^="mailto:"]');
            const found = m ? m[0].toLowerCase() : null;
            if (found && !found.includes('example.com') && !found.includes('noreply')) return found;
            return mailto?.getAttribute('href')?.replace('mailto:', '').toLowerCase() || null;
          });
          if (email) lead.email = email;
          await emailPage.close();
        } catch {}
      }
    }
  }

} catch (err) {
  console.error('Scrape failed:', err);
  throw err;
} finally {
  await browser.close();
}

// Push to dataset
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
    priceRange: lead.priceRange || null,
    openingHours: lead.openingHours?.length ? lead.openingHours : null,
    placeId: lead.placeId || null,
    socialProfiles: lead.socialProfiles?.instagram || lead.socialProfiles?.facebook ? {
      instagram: lead.socialProfiles.instagram || null,
      facebook: lead.socialProfiles.facebook || null,
      twitter: lead.socialProfiles.twitter || null,
    } : null,
    latitude: lead.lat || null,
    longitude: lead.lng || null,
    searchQuery,
    scrapedAt: new Date().toISOString(),
  });
}

console.log(`✅ Scraped ${results.length} leads for "${searchQuery}"`);

await Actor.exit();
