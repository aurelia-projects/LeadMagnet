/**
 * LeadMagnet — Apify Actor
 * Google Maps Business Lead Scraper
 * 
 * Free, open source. No API keys needed.
 * Version 0.3.0 — Reviews, amenities, coordinates, images, social profiles
 */

import { Actor } from 'apify';
import { chromium } from 'playwright';

await Actor.init();

const {
  query,
  location = '',
  maxResults = 20,
  extractEmails = true,
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

  await Promise.race([
    page.waitForSelector('.Nv2PK', { timeout: 15000 }).catch(() => {}),
  ]);

  // Scroll to load results
  for (let i = 0; i < 10 && leads.length < maxResults; i++) {
    await page.evaluate(() => {
      const feed = document.querySelector('[role="feed"]');
      if (feed) feed.scrollBy(0, feed.scrollHeight);
    });
    await page.waitForTimeout(2000);

    const businesses = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('.Nv2PK').forEach(card => {
        const name = card.getAttribute('aria-label');
        if (!name || items.find(i => i.name === name)) return;

        const fullText = card.textContent || '';
        const ratingEl = card.querySelector('[aria-label*="stars"]');
        const rating = ratingEl?.getAttribute('aria-label')?.match(/[\d.]+/)?.[0];
        const link = card.querySelector('a.hfpxzc');
        const placeUrl = link?.getAttribute('href') || '';
        const imgEl = card.querySelector('img');
        const priceEl = card.querySelector('[aria-label*="Price"]');

        // Opening hours
        const hours = [];
        const hourMatch = fullText.match(/(Open|Closed)(.+(?:AM|PM|am|pm))?/);
        if (hourMatch) hours.push(hourMatch[0].trim());

        // Amenities from tooltips
        const amens = [];
        card.querySelectorAll('[data-tooltip]').forEach(el => {
          const t = el.getAttribute('data-tooltip');
          if (t) amens.push(t);
        });

        // Reviews count
        const rCount = ratingEl?.closest('[aria-label]')?.getAttribute('aria-label')
          ?.match(/([\d,]+)\s*reviews?/)?.[1]?.replace(/,/g, '');

        // Category from text after rating
        const category = (() => {
          const m = fullText.match(/\d\.\d\s*([A-Za-z\s&-]+?)(?:\s*·\s*|\s*\d|\s*$)/);
          return m?.[1]?.trim() || '';
        })();

        // Address
        const address = (() => {
          const parts = fullText.split('·').map(s => s.trim());
          for (let i = 1; i < parts.length; i++) {
            const clean = parts[i].replace(/[\uE934\uE935\uE938\uE940]/g, '').trim();
            if (clean.length > 10 && /\d/.test(clean) && !clean.includes('AM') && !clean.includes('PM')) {
              return clean.replace(/(Closed|Open)(\s*·\s*Opens.*|\s*\d+:\d+.*)?$/, '').trim();
            }
          }
          return '';
        })();

        // Coordinates from URL
        const coords = (() => {
          const m = placeUrl.match(/!3d(-?[\d.]+)!4d(-?[\d.]+)/);
          return m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : { lat: 0, lng: 0 };
        })();

        items.push({
          name,
          category,
          address,
          rating: rating ? parseFloat(rating) : 0,
          reviewsCount: rCount ? parseInt(rCount) : 0,
          placeUrl,
          placeId: placeUrl.match(/data=!4m7.*?1s([^!]+)/)?.[1] || '',
          imageUrl: (imgEl)?.src || '',
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

  // Trim to maxResults before enrich/email to avoid wasting time
  leads.splice(maxResults);

  // ============ ENRICH EACH PLACE ============
  // Always enrich to capture website, phone, reviews count from detail panel
  for (let idx = 0; idx < leads.length; idx++) {
      const lead = leads[idx];
      console.log(`Enrich ${idx + 1}/${leads.length}: ${lead.name}`);

      try {
        if (!lead.placeUrl) continue;
        await page.goto(lead.placeUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        // Wait for dynamic content — Maps SPA loads business data async
        await page.waitForTimeout(5000);
        // Also wait for a business-specific element if it appears
        try { await page.waitForSelector('[data-item-id^="phone:"], button[data-item-id^="phone:"]', { timeout: 3000 }); } catch {}

        // Phone, website & reviews count from detail panel
        const detail = await page.evaluate(() => {
          const d = {};

          // Phone — button with data-item-id="phone:tel:+1xxxxxxxxxx"
          const phoneBtn = document.querySelector('button[data-item-id^="phone:tel:"]');
          if (phoneBtn) d.phone = phoneBtn.getAttribute('data-item-id')?.replace('phone:tel:', '') || '';

          // Website — always stored in a[data-item-id="authority"]
          const websiteEl = document.querySelector('a[data-item-id="authority"]');
          if (websiteEl) d.website = websiteEl.getAttribute('href') || '';

          // reviewsCount — walk visible text nodes, skip script/style
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                const tag = parent.tagName;
                if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
                const text = node.textContent?.trim() || '';
                if (/^([\d,]+)\s*reviews?$/i.test(text)) return NodeFilter.FILTER_ACCEPT;
                return NodeFilter.FILTER_SKIP;
              }
            }
          );
          const node = walker.nextNode();
          if (node) {
            const m = node.textContent?.trim().match(/([\d,]+)/);
            if (m) d.reviewsCount = parseInt(m[1].replace(/,/g, ''));
          }

          return d;
        });
        // DEBUG: find anything with "review" in leaf-node text
        // DEBUG: search broader for numbers followed by 'review'
        const reviewsDebug = await page.evaluate(() => {
          const results = [];
          const all = document.querySelectorAll('button, span, div, a, [aria-label]');
          for (const el of all) {
            const t = el.textContent?.trim();
            if (t && /[\d,]+\s*reviews?/i.test(t) && !/write/i.test(t)) {
              results.push({ text: t.substring(0, 80), aria: el.getAttribute('aria-label')?.substring(0, 80) });
            }
          }
          return results.slice(0, 10);
        });
        console.log('REVIEWS DEBUG:', JSON.stringify(reviewsDebug));

        if (detail.phone) lead.phone = detail.phone;
        if (detail.website) lead.website = detail.website;
        if (detail.reviewsCount) lead.reviewsCount = detail.reviewsCount;

        // Opening hours detail
        const hours = await page.evaluate(() => {
          const h = [];
          const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
          document.querySelectorAll('[aria-label*="hour"], .A1pRfd, .YMlIz').forEach(el => {
            const t = el.textContent?.trim();
            if (t && (days.some(d => t.includes(d)) || t.includes('AM') || t.includes('PM'))) h.push(t);
          });
          return h;
        });
        if (hours.length) lead.openingHoursDetail = hours;

        // Reviews
        if (extractReviews && maxReviewsPerPlace > 0) {
          await page.evaluate(() => {
            const tab = document.querySelector('[role="tab"][aria-label*="review"], button[aria-label*="review"]');
            if (tab) (tab).click();
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

  // ============ EMAILS ============
  if (extractEmails) {
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      console.log(`Email: ${i + 1}/${leads.length}: ${lead.name}`);
      if (lead.website && !lead.website.includes('google.com')) {
        try {
          const ep = await browser.newPage();
          await ep.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

          // Strip UTM params before visiting
          const cleanUrl = lead.website.split('?')[0];
          console.log('Visiting website:', cleanUrl);

          // Try homepage first
          await ep.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 8000 });
          console.log('Page loaded:', ep.url());

          const emailDebug = await ep.evaluate(() => {
            const mailtoLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]')).map(a => a.getAttribute('href'));
            const bodyText = document.body?.innerText?.substring(0, 2000) || '';
            const allEmails = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
            return { mailtoLinks, allEmails, url: window.location.href };
          });
          console.log('EMAIL DEBUG:', JSON.stringify(emailDebug));

          let email = await ep.evaluate(() => {
            // Check mailto links first (most reliable)
            const mailto = document.querySelector('a[href^="mailto:"]');
            if (mailto) return mailto.getAttribute('href').replace('mailto:', '').split('?')[0].toLowerCase().trim();

            // Check full page text
            const text = document.body?.innerText || '';
            const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (m && !m[0].includes('example.com') && !m[0].includes('noreply') && !m[0].includes('sentry')) {
              return m[0].toLowerCase();
            }
            return null;
          });

          // If not found on homepage, try /contact and /about pages
          if (!email) {
            const contactUrls = ['/contact', '/contact-us', '/about', '/about-us'];
            const base = new URL(lead.website).origin;
            for (const path of contactUrls) {
              try {
                await ep.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 8000 });
                email = await ep.evaluate(() => {
                  const mailto = document.querySelector('a[href^="mailto:"]');
                  if (mailto) return mailto.getAttribute('href').replace('mailto:', '').split('?')[0].toLowerCase().trim();
                  const text = document.body?.innerText || '';
                  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                  if (m && !m[0].includes('example.com') && !m[0].includes('noreply') && !m[0].includes('sentry')) {
                    return m[0].toLowerCase();
                  }
                  return null;
                });
                if (email) { console.log('Found email on:', base + path); break; }
              } catch {}
            }
          }

          if (email) lead.email = email;
          await ep.close();
        } catch (err) {
          console.log('Email scrape failed for ' + lead.name + ': ' + err.message);
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

// ============ OUTPUT ============
for (const lead of leads) {
  const data = {
    name: lead.name || null,
    category: lead.category || null,
    address: lead.address || null,
    phone: lead.phone || null,
    website: lead.website || null,
    email: lead.email || null,
    rating: lead.rating || null,
    reviewsCount: lead.reviewsCount || null,
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
