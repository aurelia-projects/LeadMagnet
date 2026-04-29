import { NextRequest, NextResponse } from 'next/server';

// Apify API config
// We use the VPS as proxy to run Playwright — fallback to Apify API
const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = 'zakbuildsai/LeadMagnet';

export async function POST(req: NextRequest) {
  try {
    const { query, location, maxResults = 20 } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Business type is required' }, { status: 400 });
    }

    // Try Playwright on VPS first (only works in dev/container)
    const hasPlaywright = await checkPlaywright();
    if (hasPlaywright) {
      try {
        const { scrapeLeads } = await import('@/lib/scraper');
        const leads = await scrapeLeads(query.trim(), location?.trim() || '', {
          maxResults: Math.min(maxResults, 20),
          maxScrolls: 4,
          includeEmail: false,
        });
        return NextResponse.json({
          results: leads,
          total: leads.length,
          source: 'local',
        });
      } catch {
        // Fall through to Apify
      }
    }

    // Fallback: call Apify API
    if (!APIFY_TOKEN) {
      return NextResponse.json({
        results: [],
        total: 0,
        error: 'Scraping is not available. Try the Apify actor directly.',
        apifyUrl: `https://apify.com/${ACTOR_ID}`,
      });
    }

    const apifyRes = await fetch(
      `https://api.apify.com/v2/actor/${ACTOR_ID}/run-sync?timeout=60&token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          location: location?.trim() || '',
          maxResults: Math.min(maxResults, 20),
          extractEmails: false,
        }),
      }
    );

    if (!apifyRes.ok) {
      throw new Error(`Apify API error: ${apifyRes.status}`);
    }

    const apifyData = await apifyRes.json();
    const results = apifyData?.output?.results || apifyData?.defaultDatasetId
      ? await fetchResults(apifyData.defaultDatasetId)
      : [];

    return NextResponse.json({ results, total: results.length, source: 'apify' });

  } catch (err: any) {
    console.error('Scrape error:', err);
    return NextResponse.json({
      results: [],
      error: 'Scraping temporarily unavailable. Try the Apify actor directly.',
      apifyUrl: `https://apify.com/${ACTOR_ID}`,
    });
  }
}

async function checkPlaywright(): Promise<boolean> {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    await browser.close();
    return true;
  } catch {
    return false;
  }
}

async function fetchResults(datasetId: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`
    );
    return await res.json();
  } catch {
    return [];
  }
}
