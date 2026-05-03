'use client';

import { useState, useEffect, useRef } from 'react';
import './globals.css';

export default function Home() {
  const [query, setQuery] = useState('dentist');
  const [location, setLocation] = useState('Austin, TX');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Intersection observer for scroll reveals
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Globe animation
  useEffect(() => {
    const canvas = document.getElementById('globeCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, R = 210;

    const cities = [
      { name:'New York', lat:40.7, lng:-74.0, type:'agency' },
      { name:'London', lat:51.5, lng:-0.1, type:'sales' },
      { name:'Tokyo', lat:35.7, lng:139.7, type:'research' },
      { name:'Sydney', lat:-33.9, lng:151.2, type:'realestate' },
      { name:'Dubai', lat:25.2, lng:55.3, type:'agency' },
      { name:'São Paulo', lat:-23.5, lng:-46.6, type:'sales' },
      { name:'Berlin', lat:52.5, lng:13.4, type:'research' },
      { name:'Singapore', lat:1.3, lng:103.8, type:'sales' },
      { name:'Toronto', lat:43.7, lng:-79.4, type:'realestate' },
      { name:'Mumbai', lat:19.1, lng:72.9, type:'agency' },
      { name:'Lagos', lat:6.5, lng:3.4, type:'sales' },
      { name:'Mexico City', lat:19.4, lng:-99.1, type:'research' },
      { name:'Paris', lat:48.9, lng:2.3, type:'agency' },
      { name:'Austin', lat:30.3, lng:-97.7, type:'sales' },
      { name:'Seoul', lat:37.6, lng:126.9, type:'research' },
      { name:'Cairo', lat:30.0, lng:31.2, type:'realestate' },
      { name:'Buenos Aires', lat:-34.6, lng:-58.4, type:'agency' },
      { name:'Bangkok', lat:13.8, lng:100.5, type:'sales' },
      { name:'Nairobi', lat:-1.3, lng:36.8, type:'research' },
      { name:'Los Angeles', lat:34.1, lng:-118.2, type:'realestate' },
      { name:'Amsterdam', lat:52.4, lng:4.9, type:'sales' },
      { name:'Chicago', lat:41.9, lng:-87.6, type:'agency' },
      { name:'Jakarta', lat:-6.2, lng:106.8, type:'research' },
      { name:'Madrid', lat:40.4, lng:-3.7, type:'sales' },
    ];

    const typeColors: Record<string, string> = {
      sales: '#00e5ff', agency: '#7c3aed', research: '#f97316', realestate: '#22c55e'
    };

    let rotation = 0;

    function toXY(lat: number, lng: number, rot: number) {
      const phi = (90 - lat) * Math.PI / 180;
      const theta = (lng + rot) * Math.PI / 180;
      const x = R * Math.sin(phi) * Math.cos(theta);
      const y = R * Math.cos(phi);
      return { x: cx + x, y: cy - y };
    }

    let animId: number;
    function drawGlobe(rot: number) {
      ctx!.clearRect(0, 0, W, H);

      const glow = ctx!.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.1);
      glow.addColorStop(0, 'rgba(0,229,255,0.0)');
      glow.addColorStop(1, 'rgba(0,229,255,0.04)');
      ctx!.beginPath();
      ctx!.arc(cx, cy, R + 8, 0, Math.PI * 2);
      ctx!.fillStyle = glow;
      ctx!.fill();

      const base = ctx!.createRadialGradient(cx - 60, cy - 60, 0, cx, cy, R);
      base.addColorStop(0, '#0f1622');
      base.addColorStop(1, '#070910');
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, Math.PI * 2);
      ctx!.fillStyle = base;
      ctx!.fill();

      // Grid lines
      for (let lat = -75; lat <= 75; lat += 15) {
        ctx!.beginPath();
        for (let lng = -180; lng <= 180; lng += 2) {
          const p = toXY(lat, lng + rot, 0);
          lng === -180 ? ctx!.moveTo(p.x, p.y) : ctx!.lineTo(p.x, p.y);
        }
        ctx!.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx!.lineWidth = 0.5;
        ctx!.stroke();
      }
      for (let lng = -180; lng < 180; lng += 30) {
        ctx!.beginPath();
        for (let lat = -90; lat <= 90; lat += 2) {
          const p = toXY(lat, lng + rot, 0);
          lat === -90 ? ctx!.moveTo(p.x, p.y) : ctx!.lineTo(p.x, p.y);
        }
        ctx!.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx!.lineWidth = 0.5;
        ctx!.stroke();
      }

      // Cities
      cities.forEach(c => {
        const p = toXY(c.lat, c.lng + rot, 0);
        const color = typeColors[c.type] || '#00e5ff';
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx!.fillStyle = color;
        ctx!.fill();
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx!.fillStyle = color + '33';
        ctx!.fill();
      });

      rotation += 0.15;
      animId = requestAnimationFrame(() => drawGlobe(rotation));
    }

    drawGlobe(0);

    // Counter animation
    const counterInterval = setInterval(() => {
      const citiesEl = document.getElementById('g-cities');
      const leadsEl = document.getElementById('g-leads');
      if (citiesEl) {
        const current = parseInt(citiesEl.textContent || '0');
        if (current < 47) citiesEl.textContent = String(current + 1);
      }
      if (leadsEl) {
        const current = parseInt(leadsEl.textContent || '0');
        if (current < 892) leadsEl.textContent = String(current + Math.floor(Math.random() * 5) + 1);
      }
    }, 200);

    // Live text rotation
    const liveSearches = [
      'Scanning Austin, TX — dentist — 100 results',
      'Scanning London, UK — plumber — 97 results',
      'Scanning Tokyo, JP — gym — 100 results',
      'Scanning Dubai — real estate — 88 results',
      'Scanning São Paulo — restaurant — 100 results',
      'Scanning Berlin — agency — 94 results',
      'Scanning Singapore — tech startup — 91 results',
      'Scanning Toronto — contractor — 96 results',
    ];
    let scanIdx = 0;
    const textInterval = setInterval(() => {
      const el = document.getElementById('live-text');
      if (el) {
        scanIdx = (scanIdx + 1) % liveSearches.length;
        el.textContent = liveSearches[scanIdx];
      }
    }, 4000);

    // Live feed items
    const feedCities = [
      { city: 'Singapore', count: 91, type: 'startup' },
      { city: 'London', count: 97, type: 'plumber' },
      { city: 'Tokyo', count: 100, type: 'gym' },
      { city: 'Dubai', count: 88, type: 'real estate' },
      { city: 'São Paulo', count: 100, type: 'restaurant' },
      { city: 'Berlin', count: 94, type: 'agency' },
      { city: 'Los Angeles', count: 82, type: 'contractor' },
      { city: 'Sydney', count: 96, type: 'electrician' },
      { city: 'Austin', count: 100, type: 'dentist' },
      { city: 'Chicago', count: 91, type: 'plumber' },
      { city: 'Paris', count: 73, type: 'cafe' },
      { city: 'Seoul', count: 68, type: 'tech' },
    ];

    function addFeedItem() {
      const feed = document.getElementById('live-feed');
      if (!feed) return;
      const item = feedCities[Math.floor(Math.random() * feedCities.length)];
      const div = document.createElement('div');
      div.className = 'feed-item';
      div.innerHTML = `<div class="feed-city">${item.city}</div><div class="feed-count">${item.count} leads</div><div class="feed-type">· ${item.type}</div>`;
      feed.appendChild(div);
      if (feed.children.length > 6) feed.removeChild(feed.firstChild!);
      setTimeout(() => { if (div.parentNode) div.style.opacity = '0.5'; }, 5000);
    }

    const feedInterval = setInterval(addFeedItem, 3000);
    for (let i = 0; i < 4; i++) setTimeout(addFeedItem, i * 400);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(counterInterval);
      clearInterval(textInterval);
      clearInterval(feedInterval);
    };
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    setShowResults(true);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), location: location.trim(), maxResults: 20 }),
      });
      const data = await res.json();
      if (data.error && !data.results?.length) {
        setError(data.error);
        setShowResults(false);
      } else {
        setResults(data.results || []);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (results.length === 0) return;
    const headers = ['Name', 'Category', 'Address', 'Phone', 'Website', 'Email', 'Rating', 'Reviews'];
    const csv = [
      headers.join(','),
      ...results.map(r => [
        `"${(r.name || '').replace(/"/g, '""')}"`,
        `"${(r.category || '').replace(/"/g, '""')}"`,
        `"${(r.address || '').replace(/"/g, '""')}"`,
        `"${(r.phone || '').replace(/"/g, '""')}"`,
        `"${(r.website || '').replace(/"/g, '""')}"`,
        `"${(r.email || '').replace(/"/g, '""')}"`,
        r.rating || '',
        r.reviews || '',
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${query.replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function runDemo() {
    const steps = ['step-1', 'step-2', 'step-3', 'step-4', 'step-5'];
    const fill = document.getElementById('progress-fill');
    const progressDiv = document.getElementById('demo-progress');
    if (progressDiv) progressDiv.style.display = 'block';
    
    steps.forEach((id, idx) => {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.remove('active');
          el.classList.add('done');
        }
        if (fill) fill.style.width = `${((idx + 1) / steps.length) * 100}%`;
        if (idx === steps.length - 1) {
          setTimeout(() => {
            steps.forEach(sid => {
              const el = document.getElementById(sid);
              if (el) { el.classList.remove('done'); el.classList.add('active'); }
            });
            if (fill) fill.style.width = '0%';
            if (progressDiv) progressDiv.style.display = 'none';
          }, 2000);
        }
      }, (idx + 1) * 1200);
    });
  }

  return (
    <main>
      {/* NAV */}
      <nav>
        <div className="nav-logo">
          <div className="logo-icon">⚡</div>
          Lead<span className="logo-dot">Magnet</span>
        </div>
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#data">Data fields</a>
          <a href="#usecases">Use cases</a>
          <a href="#dev">For developers</a>
          <a href="#demo">Try it</a>
        </div>
        <a href="https://apify.com/zakbuildsai/LeadMagnet" className="nav-cta">Get on Apify →</a>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-grid"></div>
        <div className="hero-orb orb1"></div>
        <div className="hero-orb orb2"></div>
        <div className="hero-orb orb3"></div>
        <div className="hero-badge">
          <div className="badge-dot"></div>
          Powered by Playwright · Runs on Apify
        </div>
        <h1 className="hero-title">
          <span className="title-line1">Turn Google Maps</span>
          <span className="title-line2">into a lead machine.</span>
        </h1>
        <p className="hero-sub">
          Enter a <strong>business type + location</strong>. Get a clean CSV with names, phones, addresses, ratings — ready for your CRM. <strong>Up to 100 leads per run.</strong>
        </p>
        <div className="hero-actions">
          <a href="#demo" className="btn-primary"><span>▶</span> Try the demo</a>
          <a href="#data" className="btn-secondary">View data fields →</a>
        </div>

        <div className="hero-terminal">
          <div className="terminal-bar">
            <div className="t-dot"></div><div className="t-dot"></div><div className="t-dot"></div>
            <div className="terminal-title">leadmagnet — output preview</div>
          </div>
          <div className="terminal-body">
            <div><span className="t-comment"># Input</span></div>
            <div><span className="t-key">business_type</span>: <span className="t-str">&quot;dentist&quot;</span> <span className="t-key">location</span>: <span className="t-str">&quot;Austin, TX&quot;</span></div>
            <br />
            <div><span className="t-comment"># Scraping Google Maps headlessly...</span></div>
            <div className="t-out">🗺 Opened Maps · Searching &quot;dentist Austin TX&quot;</div>
            <div className="t-out">📜 Scrolled · Loaded <span className="t-val">100</span> listings</div>
            <div className="t-out">🔬 Extracting business data...</div>
            <br />
            <div className="t-success">✅ leads_dentist_austin.csv (100 rows)</div>
            <br />
            <div className="t-row"><span className="t-comment">Austin Smile Studio</span> ⭐ <span className="t-key">4.9</span> 📞 <span className="t-str">+1 512-555-0101</span></div>
            <div className="t-row"><span className="t-comment">Capital City Dental</span> ⭐ <span className="t-key">4.7</span> 📞 <span className="t-str">+1 512-555-0182</span></div>
          </div>
        </div>
        <div className="apify-badge">Available on <strong>Apify Marketplace</strong> · Runs in the cloud · No setup required</div>
      </section>

      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {['🏢 Business Name', '📍 Address', '📞 Phone Number', '⭐ Rating + Reviews', '🌐 Website URL', '✉ Email (when found)', '📂 Category', '🗺 Lat / Lng'].map((item, i) => (
            <span className="ticker-item" key={i}>{item} <span>✓</span></span>
          ))}
          {['🏢 Business Name', '📍 Address', '📞 Phone Number', '⭐ Rating + Reviews', '🌐 Website URL', '✉ Email (when found)', '📂 Category', '🗺 Lat / Lng'].map((item, i) => (
            <span className="ticker-item" key={i+8}>{item} <span>✓</span></span>
          ))}
        </div>
      </div>

      {/* GLOBE */}
      <section className="globe-section">
        <div className="globe-inner">
          <div className="globe-text reveal">
            <div className="section-label">Global reach</div>
            <h2 className="globe-title">Scan any city.<br /><span className="gradient-text">Any market.<br />Anywhere.</span></h2>
            <p className="globe-sub">LeadMagnet works on every Google Maps market worldwide. Drop a city, a neighborhood, a country — real businesses, real contacts.</p>
            <div className="globe-stats">
              <div className="gstat">
                <div className="gstat-num" id="g-cities">0</div>
                <div className="gstat-label">Cities scanned today</div>
              </div>
              <div className="gstat">
                <div className="gstat-num" id="g-leads">0</div>
                <div className="gstat-label">Leads extracted</div>
              </div>
              <div className="gstat">
                <div className="gstat-num">190+</div>
                <div className="gstat-label">Countries supported</div>
              </div>
              <div className="gstat">
                <div className="gstat-num">&lt;3min</div>
                <div className="gstat-label">Avg. run time</div>
              </div>
            </div>
            <div className="globe-live">
              <div className="live-dot"></div>
              <span id="live-text">Scanning Austin, TX — dentist — 100 results</span>
            </div>
          </div>
          <div className="globe-canvas-wrap reveal">
            <div className="globe-ring" style={{width: 520, height: 520}}></div>
            <div className="globe-ring" style={{width: 520, height: 520}}></div>
            <div className="globe-ring" style={{width: 520, height: 520}}></div>
            <canvas id="globeCanvas" width={460} height={460}></canvas>
            <div className="scan-label" id="scan-label">● SCANNING GLOBAL MARKETS</div>
            <div className="live-feed" id="live-feed"></div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how">
        <div className="section-inner">
          <div className="section-label">How it works</div>
          <h2 className="section-title reveal">Five steps.<br />One CSV.</h2>
          <p className="section-sub reveal">LeadMagnet automates the entire pipeline — from Google Maps search to enriched, export-ready data.</p>
          <div className="steps-grid reveal">
            {[
              { num: '01 / 05', icon: '🗺', title: 'Open Google Maps', desc: 'Launches a headless Playwright browser and navigates to Google Maps with your search query.' },
              { num: '02 / 05', icon: '📜', title: 'Scroll & load listings', desc: 'Automatically scrolls through the results panel until up to 100 listings are visible.' },
              { num: '03 / 05', icon: '🔬', title: 'Extract every data point', desc: 'Parses name, address, phone, website, rating, category, and GPS coordinates from each listing.' },
              { num: '04 / 05', icon: '✉', title: 'Visit sites for emails', desc: 'Visits each business website for emails when available (requires Apify proxy — disabled on free tier).' },
              { num: '05 / 05', icon: '📤', title: 'Export clean CSV', desc: 'Outputs a structured CSV — ready to import into any CRM, spreadsheet, or pipeline.' },
            ].map((step, i) => (
              <div className="step-card" key={i}>
                <div className="step-num">{step.num}</div>
                <div className="step-icon">{step.icon}</div>
                <div className="step-title">{step.title}</div>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DATA FIELDS */}
      <section id="data" className="fields-section">
        <div className="section-inner">
          <div className="section-label">Output fields</div>
          <h2 className="section-title reveal">Everything you need.<br />Nothing you don't.</h2>
          <p className="section-sub reveal">Every row in your CSV export contains structured fields — clean, consistent, CRM-ready.</p>
          <div className="fields-grid reveal">
            {[
              { icon: '🏢', name: 'name', desc: 'Full business name', badge: 'ALWAYS PRESENT' },
              { icon: '📂', name: 'category', desc: 'Primary business category', badge: 'ALWAYS PRESENT' },
              { icon: '📍', name: 'address', desc: 'Full street address', badge: 'ALWAYS PRESENT' },
              { icon: '📞', name: 'phone', desc: 'Primary contact number', badge: 'ALWAYS PRESENT' },
              { icon: '🌐', name: 'website', desc: 'Business website URL', badge: 'ALWAYS PRESENT' },
              { icon: '✉', name: 'email', desc: 'Email from website (requires proxy)', badge: 'WHEN FOUND' },
              { icon: '⭐', name: 'rating', desc: 'Average star rating (1-5)', badge: 'ALWAYS PRESENT' },
              { icon: '💬', name: 'reviews', desc: 'Total Google reviews count', badge: 'WHEN AVAILABLE' },
              { icon: '🧭', name: 'latitude', desc: 'GPS latitude', badge: 'ALWAYS PRESENT' },
              { icon: '🧭', name: 'longitude', desc: 'GPS longitude', badge: 'ALWAYS PRESENT' },
            ].map((field, i) => (
              <div className="field-card" key={i}>
                <div className="field-icon">{field.icon}</div>
                <div className="field-name">{field.name}</div>
                <p className="field-desc">{field.desc}</p>
                <span className="field-badge">{field.badge}</span>
              </div>
            ))}
          </div>

          <div className="csv-preview reveal">
            <div className="csv-header">
              <div className="csv-filename"><div className="csv-dot"></div> leads_plumber_london.csv</div>
              <div className="csv-meta">100 rows · 10 columns · 42KB</div>
            </div>
            <div className="csv-table-wrap">
              <table className="csv-table">
                <thead><tr><th>name</th><th>category</th><th>address</th><th>phone</th><th>website</th><th>email</th><th>rating</th><th>reviews</th><th>lat</th><th>lng</th></tr></thead>
                <tbody>
                  {[
                    { name: 'London Expert Plumbers', c: 'Plumber', a: '14 Baker St, London W1U 6SJ', p: '+44 20 7946 0012', w: 'londonexpertplumbers.co.uk', e: 'info@londonexpert.co.uk', r: '4.9', v: '312' },
                    { name: 'Capital Fix Plumbing', c: 'Plumber', a: '88 Piccadilly, London W1J 8EG', p: '+44 20 7123 4567', w: 'capitalfixplumbing.com', e: '—', r: '4.7', v: '198' },
                    { name: 'FastFlow Emergency', c: 'Plumber', a: '22 Victoria St, London SW1H 0NW', p: '+44 20 7654 3210', w: 'fastflowlondon.co.uk', e: '—', r: '4.6', v: '445' },
                    { name: 'TrustMark Pipes & Drains', c: 'Plumber', a: '5 High Holborn, London WC1V 6BZ', p: '+44 20 7890 1234', w: 'trustmarkpipes.co.uk', e: 'contact@trustmarkpipes.co.uk', r: '4.8', v: '267' },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="td-name">{row.name}</td>
                      <td>{row.c}</td><td>{row.a}</td>
                      <td className="td-phone">{row.p}</td>
                      <td>{row.w}</td>
                      <td className="td-email">{row.e}</td>
                      <td className="td-rating">{row.r}⭐</td>
                      <td>{row.v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="usecases" className="use-section">
        <div className="section-inner">
          <div className="section-label">Use cases</div>
          <h2 className="section-title reveal">Built for builders.<br />Used by everyone.</h2>
          <p className="section-sub reveal">LeadMagnet fits naturally into sales, research, and automation workflows.</p>
          <div className="use-grid">
            {[
              { icon: '🎯', title: 'Sales prospecting', desc: 'Find businesses anywhere — dentists in London, plumbers in Austin — and reach them directly.', tags: ['outreach', 'cold email', 'CRM'] },
              { icon: '📊', title: 'Market research', desc: 'Analyze competitors by category and rating across cities. Benchmark and map saturation.', tags: ['competitor analysis', 'density'] },
              { icon: '🏭', title: 'Lead gen agencies', desc: 'Bulk collect local data for clients. Deliver fresh lists on demand.', tags: ['bulk export', 'white-label'] },
              { icon: '🏡', title: 'Real estate & delivery', desc: 'Find service partners or delivery targets in specific zones.', tags: ['partner discovery', 'geo'] },
            ].map((use, i) => (
              <div className="use-card reveal" key={i}>
                <div className="use-icon">{use.icon}</div>
                <div className="use-title">{use.title}</div>
                <p className="use-desc">{use.desc}</p>
                <div className="use-tags">{use.tags.map((t, j) => <span className="tag" key={j}>{t}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-section">
        <div className="stats-grid">
          {[
            { n: '100', l: 'Leads per run' },
            { n: '10', l: 'Data fields per lead' },
            { n: '100+', l: 'Countries supported' },
            { n: '∞', l: 'Locations worldwide' },
          ].map((s, i) => (
            <div className="stat-item" key={i}><div className="stat-num">{s.n}</div><div className="stat-label">{s.l}</div></div>
          ))}
        </div>
      </div>

      {/* DEV */}
      <section id="dev" className="dev-section">
        <div className="section-inner">
          <div className="dev-grid">
            <div className="dev-info reveal">
              <div className="section-label">For developers</div>
              <div className="dev-title">API-first.<br />Fully scriptable.</div>
              <p className="dev-sub">Integrate LeadMagnet into your pipeline via the Apify API.</p>
              <div className="dev-features">
                {[
                  { t: 'Apify API + SDK', d: 'Trigger runs, poll status, download datasets via REST or SDK.' },
                  { t: 'Webhooks', d: 'POST to your endpoint on run complete. Trigger Zapier, Make, or your backend.' },
                  { t: 'JSON + CSV', d: 'Download results as JSON for pipelines or CSV for CRMs.' },
                  { t: 'Scheduled runs', d: 'Refresh lead lists daily or weekly automatically.' },
                ].map((f, i) => (
                  <div className="dev-feat" key={i}>
                    <div className="feat-check">✓</div>
                    <div className="feat-text"><strong>{f.t}</strong><span>{f.d}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="code-block reveal">
              <div className="code-bar">
                <div className="code-lang">JavaScript</div>
                <button className="code-copy" onClick={e => {
                  const btn = e.currentTarget;
                  navigator.clipboard.writeText("import { ApifyClient } from 'apify-client';\nconst client = new ApifyClient({ token: 'YOUR_TOKEN' });\nconst run = await client.actor('zakbuildsai/LeadMagnet').call({ query: 'dentist', location: 'Austin, TX', maxResults: 100 });");
                  btn.textContent = 'Copied!';
                  setTimeout(() => btn.textContent = 'Copy', 2000);
                }}>Copy</button>
              </div>
              <pre className="code-body">{`import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: 'YOUR_APIFY_TOKEN',
});

const run = await client.actor('zakbuildsai/LeadMagnet').call({
  query: 'dentist',
  location: 'Austin, TX',
  maxResults: 100,
});

const { items } = await client
  .dataset(run.defaultDatasetId)
  .listItems();

items.forEach(lead => {
  console.log(lead.name, lead.phone);
});`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO + SEARCH */}
      <section id="demo" className="demo-section">
        <div className="section-inner" style={{textAlign: 'center'}}>
          <div className="section-label" style={{justifyContent: 'center', marginBottom: 16}}>
            <span style={{width: 24, height: 1, background: 'var(--accent)', display: 'block'}}></span>
            Live demo
          </div>
          <h2 className="section-title reveal" style={{marginBottom: 12}}>See it in action.</h2>
          <p style={{color: 'var(--muted)', fontSize: 16, marginBottom: 40}} className="reveal">Search for any business type + location to get real leads.</p>
        </div>

        <div className="demo-card reveal">
          <div className="demo-title">Search for leads</div>
          <p className="demo-sub">Enter a business type and location to scrape Google Maps.</p>
          <form onSubmit={handleSearch}>
            <div className="demo-row">
              <div className="demo-field">
                <label className="demo-label">Business type</label>
                <input type="text" className="demo-input" placeholder="e.g. dentist, plumber, gym" value={query} onChange={e => setQuery(e.target.value)} required />
              </div>
              <div className="demo-field">
                <label className="demo-label">Location</label>
                <input type="text" className="demo-input" placeholder="e.g. Austin TX, London UK" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
            </div>
            <div className="demo-row">
              <div className="demo-field">
                <label className="demo-label">Max results</label>
                <select className="demo-input">
                  <option value="20">20 leads</option>
                  <option value="50">50 leads</option>
                  <option value="100">100 leads</option>
                </select>
              </div>
              <div className="demo-field">
                <label className="demo-label">Source</label>
                <select className="demo-input">
                  <option>Apify Cloud</option>
                  <option>Local VPS</option>
                </select>
              </div>
            </div>
            <button type="submit" className="demo-btn" disabled={loading}>
              {loading ? '▶ Searching...' : '▶ Find Leads'}
            </button>
          </form>

          {error && (
            <div style={{marginTop: 20, padding: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: '#ef4444', fontSize: 13}}>
              {error}
              <div style={{marginTop: 12}}>
                <a href="https://apify.com/zakbuildsai/LeadMagnet" target="_blank" className="demo-btn" style={{width: 'auto', display: 'inline-flex', padding: '10px 20px', fontSize: 13}}>Run on Apify →</a>
              </div>
            </div>
          )}

          {showResults && results.length > 0 && (
            <div style={{marginTop: 24}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                <p style={{color: 'var(--muted)', fontSize: 13}}>Found <strong style={{color: 'var(--text)'}}>{results.length}</strong> leads</p>
                <button className="export-btn" onClick={exportCSV}>↓ Export CSV</button>
              </div>
              <div className="results-table">
                <table>
                  <thead><tr><th>Name</th><th>Category</th><th>Phone</th><th>Rating</th></tr></thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i}>
                        <td style={{color: 'var(--text)', fontWeight: 500}}>{r.name}</td>
                        <td>{r.category || '—'}</td>
                        <td className="td-phone">{r.phone || '—'}</td>
                        <td className="td-rating">{r.rating ? `${r.rating}⭐` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{marginTop: 32}}>
            <p style={{fontSize: 13, color: 'var(--muted2)', marginBottom: 12}}>No real data? Try the simulation:</p>
            <button type="button" className="demo-btn" style={{background: 'transparent', border: '1px solid var(--border2)', color: 'var(--text)'}} onClick={runDemo}>▶ Simulate a run</button>
          </div>

          <div className="demo-progress" id="demo-progress">
            <div className="progress-bar"><div className="progress-fill" id="progress-fill"></div></div>
            <div className="progress-steps">
              {['Opening Google Maps...', 'Scrolling listings...', 'Extracting data...', 'Checking for emails...', 'Exporting CSV...'].map((s, i) => (
                <div className="progress-step active" id={`step-${i + 1}`} key={i}>
                  <div className="step-indicator">{i + 1}</div>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2 className="cta-title reveal">Ready to <span className="gradient-text">capture leads</span>?</h2>
        <p className="cta-sub reveal">No scraping setup. No API keys. No rate limits. Just a search and a CSV.</p>
        <div className="cta-actions reveal">
          <a href="https://apify.com/zakbuildsai/LeadMagnet" className="btn-primary">Get it on Apify →</a>
          <a href="#dev" className="btn-secondary">View the API docs</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-brand"><div className="logo-icon" style={{width: 28, height: 28, fontSize: 12}}>⚡</div> Lead<span className="logo-dot">Magnet</span></div>
        <div className="footer-links">
          <a href="#how">Docs</a>
          <a href="#dev">API</a>
          <a href="https://apify.com/zakbuildsai/LeadMagnet">Apify</a>
        </div>
        <div className="footer-copy">Built on Apify · Powered by Playwright</div>
      </footer>
    </main>
  );
}
