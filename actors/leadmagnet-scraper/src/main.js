/**
 * LeadMagnet — Apify Actor
 * Google Maps Business Lead Scraper
 *
 * Free, open source. No API keys needed.
 * Version 0.4.1 — Debug reviewsCount, restored address + hours
 */

import { Actor } from 'apify';
import { chromium } from 'playwright';

await Actor.init();

const {
  query,
  location = '',
  maxResults = 20,
  extractEmails = false,
  extractReviews = false,
  maxReviewsPerPlace = 5,
  extractImages = false,
  extractAmenities = true,
} = await Actor.getInput() || {};

if (!query) throw new Error('Business type (query) is required');

const searchQuery = location ? `${query} ${location}` : query;
const leads = [];

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

  // ============ SEARCH ============
  const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}/`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.waitForSelector('.Nv2PK', { timeout: 15000 }).catch(() => {});

  // Scroll to load results
  for (let i = 0; i < 10 && leads.length < maxResults; i++) {
    await page.evaluate(() => {
      const feed = document.querySelector('[role="feed"]');
      if (feed) feed.scrollBy(0, feed.scrollHeight);
    });
    await page.waitForTimeout(2000);

    const businesses = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('.Nv2PK').forEach((card) => {
        const name = card.getAttribute('aria-label');
        if (!name || items.find(i => i.name === name)) return;

        const fullText = card.textContent || '';
        const link = card.querySelector('a.hfpxzc');
        const placeUrl = link?.getAttribute('href') || '';
        const imgEl = card.querySelector('img');
        const priceEl = card.querySelector('[aria-label*="Price"]');

        // Rating
        const ratingEl = card.querySelector('[aria-label*="stars"]');
        const ratingLabel = ratingEl?.getAttribute('aria-label') || '';
        const rating = ratingLabel.match(/[\d.]+/)?.[0];

        // reviewsCount — not available on search cards (confirmed by debug), captured in detail enrich

        // Opening hours — capture "Closed · Opens 8 AM Mon" etc.
        const hours = [];
        const hourMatch = fullText.match(/((?:Open|Closed)[^\n]*)/i);
        if (hourMatch) {
          const cleaned = hourMatch[0].replace(/\s*(Book online|Order online|Menu|Website)\s*$/i, '').trim();
          if (cleaned) hours.push(cleaned);
        }

        // Amenities
        const amens = [];
        card.querySelectorAll('[data-tooltip]').forEach(el => {
          const t = el.getAttribute('data-tooltip');
          if (t) amens.push(t);
        });

        // Category
        const category = (() => {
          const m = fullText.match(/\d\.\d\s*([A-Za-z\s&'-]+?)(?:\s*·|\s*\d|\s*$)/);
          return m?.[1]?.trim() || '';
        })();

        // Address — segment after · containing a digit, no AM/PM
        const address = (() => {
          const parts = fullText.split('·').map(s => s.trim());
          for (let i = 1; i < parts.length; i++) {
            const clean = parts[i].replace(/[\uE934\uE935\uE938\uE940]/g, '').trim();
            if (clean.length > 5 && /\d/.test(clean) && !clean.match(/\b(AM|PM)\b/i) && !clean.match(/^\d+\.\d/)) {
              return clean.replace(/(Closed|Open)\b.*/i, '').trim();
            }
          }
          return '';
        })();

        // Coordinates
        const coords = (() => {
          const m = placeUrl.match(/!3d(-?[\d.]+)!4d(-?[\d.]+)/);
          return m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : { lat: null, lng: null };
        })();

        items.push({
          name,
          category,
          address: address || '',
          rating: rating ? parseFloat(rating) : null,
          reviewsCount: null,
          placeUrl,
          placeId: placeUrl.match(/1s([^!]+)!8m/)?.[1] || '',
          imageUrl: imgEl?.src || '',
          openingHours: hours,
          amenities: amens,
          priceRange: priceEl?.getAttribute('aria-label')?.replace('Price: ', '') || '',
          lat: coords.lat,
          lng: coords.lng,
          socialProfiles: {
            instagram: '', facebook: '', twitter: '',
          },

        });
      });
      return items;
    });

    for (const biz of businesses) {
      if (!leads.find(l => l.name === biz.name)) {
        leads.push(biz);
      }
    }
  }

  leads.splice(maxResults);

  // ============ ENRICH EACH PLACE ============
  for (let idx = 0; idx < leads.length; idx++) {
    const lead = leads[idx];
    console.log(`Enrich ${idx + 1}/${leads.length}: ${lead.name}`);

    try {
      if (!lead.placeUrl) continue;
      await page.goto(lead.placeUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(4000);
      try {
        await page.waitForSelector('button[data-item-id^="phone:tel:"]', { timeout: 4000 });
      } catch {}

      const detail = await page.evaluate(() => {
        const d = {};

        // Phone
        const phoneBtn = document.querySelector('button[data-item-id^="phone:tel:"]');
        if (phoneBtn) d.phone = phoneBtn.getAttribute('data-item-id')?.replace('phone:tel:', '') || '';

        // Website
        const websiteEl = document.querySelector('a[data-item-id="authority"]');
        if (websiteEl) d.website = websiteEl.getAttribute('href') || '';

        // reviewsCount — exact match aria-label "N reviews"
        for (const el of document.querySelectorAll('[aria-label]')) {
          const label = el.getAttribute('aria-label') || '';
          const m = label.match(/^([\d,]+)\s+reviews?$/i);
          if (m) { d.reviewsCount = parseInt(m[1].replace(/,/g, '')); break; }
        }

        // Fallback: button/span text "N reviews"
        if (!d.reviewsCount) {
          for (const el of document.querySelectorAll('button, span')) {
            const text = el.textContent?.trim() || '';
            const m = text.match(/^([\d,]+)\s+reviews?$/i);
            if (m) { d.reviewsCount = parseInt(m[1].replace(/,/g, '')); break; }
          }
        }

        return d;
      });

      if (detail.phone) lead.phone = detail.phone;
      if (detail.website) lead.website = detail.website;
      if (detail.reviewsCount && !lead.reviewsCount) lead.reviewsCount = detail.reviewsCount;

      // Opening hours detail
      const hours = await page.evaluate(() => {
        const h = [];
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        document.querySelectorAll('[aria-label*="hour" i], .A1pRfd, .YMlIz').forEach(el => {
          const t = el.textContent?.trim();
          if (t && (days.some(d => t.includes(d)) || t.match(/\b(AM|PM)\b/i))) h.push(t);
        });
        return [...new Set(h)];
      });
      if (hours.length) lead.openingHoursDetail = hours;

      // Reviews
      if (extractReviews && maxReviewsPerPlace > 0) {
        await page.evaluate(() => {
          const tab = document.querySelector('[role="tab"][aria-label*="review" i], button[aria-label*="review" i]');
          if (tab) tab.click();
        });
        await page.waitForTimeout(2000);

        for (let s = 0; s < 3; s++) {
          await page.evaluate(() => {
            const rs = document.querySelector('.m6QErb[role="region"], .lwmHm');
            if (rs) rs.scrollBy(0, 400); else window.scrollBy(0, 300);
          });
          await page.waitForTimeout(1500);
        }

        const reviews = await page.evaluate((max) => {
          const r = [];
          document.querySelectorAll('.jftiEf, [data-review-id]').forEach(card => {
            if (r.length >= max) return;
            const name = card.querySelector('.d4r55, .TSUosb')?.textContent?.trim();
            if (!name || r.find(ri => ri.reviewerName === name)) return;
            r.push({
              reviewerName: name,
              rating: parseFloat(card.querySelector('[aria-label*="stars"]')?.getAttribute('aria-label')?.match(/[\d.]+/)?.[0] || '0'),
              text: card.querySelector('.wiI7pd, .MyEned')?.textContent?.trim() || '',
              publishDate: card.querySelector('.rsqaWe, .TI2lzfb')?.textContent?.trim() || '',
              likes: parseInt(card.querySelector('.C8e1Kd')?.textContent?.replace(/[^0-9]/g, '') || '0'),
            });
          });
          return r;
        }, maxReviewsPerPlace);
        if (reviews.length) lead.reviews = reviews;
      }

    } catch (err) {
      console.log(`  Skip enrich for ${lead.name}: ${err.message}`);
    }
  }

  if (extractEmails) {
    console.log('⚠️  Email extraction not available under LIMITED_PERMISSIONS — skipping.');
  }

} catch (err) {
  console.error('Scrape failed:', err);
  throw err;
} finally {
  await browser.close();
}

// ============ OUTPUT ============
for (const lead of leads) {
  const data = {
    name: lead.name || null,
    category: lead.category || null,
    address: lead.address || null,
    phone: lead.phone || null,
    website: lead.website ? lead.website.split('?')[0] : null,
    email: lead.email || null,
    rating: lead.rating || null,
    reviewsCount: (lead.reviewsCount && lead.reviewsCount > 0) ? lead.reviewsCount : null,
    reviews: lead.reviews?.length ? lead.reviews.slice(0, maxReviewsPerPlace) : null,
    priceRange: lead.priceRange || null,
    openingHours: lead.openingHours?.length ? lead.openingHours : null,
    openingHoursDetailed: lead.openingHoursDetail?.length ? lead.openingHoursDetail : null,
    amenities: lead.amenities?.length ? lead.amenities : null,
    imageUrl: lead.imageUrl || null,
    placeId: lead.placeId || null,
    placeUrl: lead.placeUrl || null,
    latitude: lead.lat || null,
    longitude: lead.lng || null,
    searchQuery,
    scrapedAt: new Date().toISOString(),
  };
  await Actor.pushData(data);
}

console.log(`✅ Scraped ${leads.length} leads for "${searchQuery}"`);
await Actor.exit();
