'use client';

import { useState } from 'react';
import './globals.css';

export default function Home() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), location: location.trim() }),
      });
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
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
    const headers = ['Name', 'Category', 'Address', 'Phone', 'Website', 'Rating', 'Reviews'];
    const csv = [
      headers.join(','),
      ...results.map(r => [
        `"${(r.name || '').replace(/"/g, '""')}"`,
        `"${(r.category || '').replace(/"/g, '""')}"`,
        `"${(r.address || '').replace(/"/g, '""')}"`,
        `"${(r.phone || '').replace(/"/g, '""')}"`,
        `"${(r.website || '').replace(/"/g, '""')}"`,
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

  return (
    <main>
      <div className="container">
        <div className="hero">
          <h1>Lead<span>Magnet</span></h1>
          <p>Find business leads. Free. No account needed.</p>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <div className="search-row">
            <input
              type="text"
              className="search-input"
              placeholder="What? (e.g., dentists, plumbers, restaurants)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              required
            />
            <input
              type="text"
              className="search-input"
              placeholder="Where? (e.g., Kuala Lumpur, New York)"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
            <button
              type="submit"
              className="search-btn"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Find Leads →'}
            </button>
          </div>
        </form>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <p>
                Found <strong>{results.length}</strong> leads
              </p>
              <button className="export-btn" onClick={exportCSV}>
                ↓ Export CSV
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th className="hide-mobile">Address</th>
                    <th>Phone</th>
                    <th className="hide-tablet">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i}>
                      <td className="name-cell">{r.name}</td>
                      <td>{r.category || '-'}</td>
                      <td className="hide-mobile" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.address || '-'}
                      </td>
                      <td>
                        {r.phone ? (
                          <a href={`tel:${r.phone}`} className="phone-link">{r.phone}</a>
                        ) : '-'}
                      </td>
                      <td className="hide-tablet">
                        {r.rating ? (
                          <span className="rating">
                            <span className="star">★</span>
                            {r.rating} <span className="review-count">({r.reviews})</span>
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="footer-watermark">
              Powered by LeadMagnet — Get unlimited leads at leadmagnet.vercel.app
            </p>
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div className="empty-state">
            <p>Enter a business type to find leads.</p>
            <p className="hint">e.g., &quot;dentists&quot; in &quot;Kuala Lumpur&quot;</p>
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Scraping Google Maps for leads...</p>
          </div>
        )}
      </div>
    </main>
  );
}
