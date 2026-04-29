import { NextRequest, NextResponse } from 'next/server';

// Check if Playwright's Chromium is installed
const HAS_BROWSER = (() => {
  try {
    require.resolve('playwright');
    return true;
  } catch {
    return false;
  }
})();

export async function POST(req: NextRequest) {
  try {
    const { query, location, maxResults = 100 } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Business type is required' }, { status: 400 });
    }

    if (!HAS_BROWSER) {
      return NextResponse.json({
        results: [],
        error: 'Browser not available. Deploy with Playwright or run on Apify.',
      }, { status: 200 });
    }

    // Dynamic import — only available where Playwright is installed
    const { scrapeLeads } = await import('@/lib/scraper');
    const leads = await scrapeLeads(query.trim(), location?.trim() || '', {
      maxResults: Math.min(maxResults, 100),
      maxScrolls: 6,
      includeEmail: false, // Email extraction is slow — only on Apify
      timeout: 45000,
    });

    return NextResponse.json({
      results: leads.slice(0, 100),
      total: leads.length,
      query: query.trim(),
      location: location?.trim() || '',
    });

  } catch (err: any) {
    console.error('Scrape error:', err);
    return NextResponse.json({ error: err.message || 'Scraping failed' }, { status: 500 });
  }
}
