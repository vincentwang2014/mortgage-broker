import React, { useState, useEffect, useRef } from 'react';

const CATEGORIES = ['all', 'rates', 'market', 'regulatory', 'other'];

function ShareMenu({ article }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (!ref.current?.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function share(platform) {
    const url = article.link || window.location.href;
    const text = article.headline || article.title;
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    if (platform === 'copy') { navigator.clipboard.writeText(url); setOpen(false); }
    if (platform !== 'copy') setOpen(false);
  }

  return (
    <div className="share-menu" ref={ref}>
      <button className="btn btn-outline btn-sm" onClick={() => setOpen(v => !v)}>Share</button>
      {open && (
        <div className="share-dropdown">
          <button className="share-option" onClick={() => share('twitter')}>Share on X</button>
          <button className="share-option" onClick={() => share('facebook')}>Share on Facebook</button>
          <button className="share-option" onClick={() => share('copy')}>Copy link</button>
        </div>
      )}
    </div>
  );
}

function InlineCTA() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch { setStatus('error'); }
  }

  return (
    <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1rem', color: 'white' }}>
      <h3 style={{ color: 'var(--gold)', fontFamily: 'var(--font-heading)', marginBottom: '0.4rem', fontSize: '1.1rem' }}>
        Get this in your inbox
      </h3>
      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
        Weekly mortgage market digest — every Tuesday morning.
      </p>
      {status === 'success' ? (
        <p style={{ color: 'var(--gold)', fontSize: '0.88rem' }}>You're subscribed!</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            className="form-input"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{ flex: 1, minWidth: '180px' }}
          />
          <button className="btn btn-gold" disabled={status === 'loading'}>
            {status === 'loading' ? '...' : 'Subscribe'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/news${category !== 'all' ? `?category=${category}` : ''}`);
        if (!res.ok) throw new Error('Failed to load news');
        const data = await res.json();
        setArticles(data.articles || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [category]);

  const displayed = articles;

  return (
    <div className="page news-page">
      <div className="container">
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.375rem' }}>
            Mortgage Market News
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            AI-summarized from HousingWire, Mortgage News Daily, CFPB, Freddie Mac, and MBA — refreshed every 6 hours.
          </p>
        </div>

        <div className="category-filters">
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`filter-btn${category === c ? ' active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {loading && (
          <div className="state-box">
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Fetching and summarizing latest news...</p>
          </div>
        )}

        {error && !loading && (
          <div className="state-box">
            <h3>Could not load news</h3>
            <p>{error}</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Make sure the backend server is running.</p>
          </div>
        )}

        {!loading && !error && displayed.length === 0 && (
          <div className="state-box">
            <h3>No articles found</h3>
            <p>Try a different category or check back shortly.</p>
          </div>
        )}

        {!loading && !error && displayed.length > 0 && (
          <div>
            {displayed.map((article, i) => (
              <React.Fragment key={article.link || i}>
                {i === 4 && <InlineCTA />}
                <article className="news-article">
                  <div className="article-meta">
                    <span className={`tag tag-${article.category || 'other'}`}>{article.category || 'other'}</span>
                    <span className="article-source">{article.source}</span>
                    <span className="article-source">&middot; {article.date}</span>
                  </div>
                  <h2 className="article-headline">{article.headline || article.title}</h2>
                  <p className="article-summary">{article.summary || article.content?.slice(0, 200)}</p>
                  <div className="article-footer">
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {article.link && (
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline btn-sm"
                        >
                          Read more
                        </a>
                      )}
                    </div>
                    <ShareMenu article={article} />
                  </div>
                </article>
              </React.Fragment>
            ))}
            {displayed.length <= 4 && <InlineCTA />}
          </div>
        )}
      </div>
    </div>
  );
}
