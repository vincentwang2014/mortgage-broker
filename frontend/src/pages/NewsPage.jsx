import React, { useState, useEffect, useRef } from 'react';
import { useLang } from '../App.jsx';

const CAT_KEYS = ['all', 'rates', 'market', 'regulatory', 'other'];

// Module-level cache: survives React Router navigations within the same session.
// The skeleton only shows once per 5 minutes instead of on every tab visit.
let _cache = null;
let _cacheAt = 0;
const CACHE_TTL = 5 * 60 * 1000;
const cacheIsFresh = () => _cache !== null && Date.now() - _cacheAt < CACHE_TTL;

function ShareMenu({ article }) {
  const { T } = useLang();
  const N = T.news;
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
    if (platform === 'copy') { navigator.clipboard.writeText(url); }
    setOpen(false);
  }

  return (
    <div className="share-menu" ref={ref}>
      <button className="btn btn-outline btn-sm" onClick={() => setOpen(v => !v)}>{N.share}</button>
      {open && (
        <div className="share-dropdown">
          <button className="share-option" onClick={() => share('twitter')}>{N.shareX}</button>
          <button className="share-option" onClick={() => share('facebook')}>{N.shareFacebook}</button>
          <button className="share-option" onClick={() => share('copy')}>{N.copyLink}</button>
        </div>
      )}
    </div>
  );
}

function InlineCTA() {
  const { T } = useLang();
  const N = T.news;
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
      <h3 style={{ color: 'var(--gold)', fontFamily: 'var(--font-heading)', marginBottom: '0.4rem', fontSize: '1.1rem' }}>{N.ctaTitle}</h3>
      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>{N.ctaSub}</p>
      {status === 'success' ? (
        <p style={{ color: 'var(--gold)', fontSize: '0.88rem' }}>{N.subscribed}</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input className="form-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={N.emailPlaceholder} style={{ flex: 1, minWidth: '180px' }} />
          <button className="btn btn-gold" disabled={status === 'loading'}>{status === 'loading' ? '...' : N.subscribe}</button>
        </form>
      )}
    </div>
  );
}

function NewsSkeleton() {
  const rows = [
    { tag: 56, src: 90, date: 60, h: '80%', l1: '95%', l2: '68%' },
    { tag: 72, src: 75, date: 50, h: '65%', l1: '88%', l2: '55%' },
    { tag: 60, src: 85, date: 65, h: '75%', l1: '92%', l2: '72%' },
    { tag: 50, src: 95, date: 55, h: '70%', l1: '85%', l2: '60%' },
    { tag: 64, src: 80, date: 58, h: '85%', l1: '90%', l2: '65%' },
  ];
  return (
    <>
      {rows.map((r, i) => (
        <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
            <span className="skeleton" style={{ width: r.tag, height: 20, borderRadius: 100 }} />
            <span className="skeleton" style={{ width: r.src, height: 14 }} />
            <span className="skeleton" style={{ width: r.date, height: 14 }} />
          </div>
          <span className="skeleton" style={{ width: r.h, height: 20, marginBottom: '0.5rem' }} />
          <span className="skeleton" style={{ width: r.l1, height: 14, marginBottom: '0.375rem' }} />
          <span className="skeleton" style={{ width: r.l2, height: 14, marginBottom: '1.25rem' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="skeleton" style={{ width: 80, height: 32, borderRadius: 8 }} />
            <span className="skeleton" style={{ width: 70, height: 32, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </>
  );
}

export default function NewsPage() {
  const { T } = useLang();
  const N = T.news;
  const [allArticles, setAllArticles] = useState(_cache || []);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(!cacheIsFresh());
  const [error, setError] = useState(null);

  // Only fetch from the server when the module-level cache is stale.
  // Category changes filter in-memory — no new network request.
  useEffect(() => {
    if (cacheIsFresh()) return;
    async function load() {
      setLoading(true); setError(null);
      try {
        const res = await fetch('/api/news');
        if (!res.ok) throw new Error('Failed to load news');
        const data = await res.json();
        _cache = data.articles || [];
        _cacheAt = Date.now();
        setAllArticles(_cache);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const articles = category === 'all' ? allArticles : allArticles.filter(a => a.category === category);

  return (
    <div className="page news-page">
      <div className="page-header">
        <div className="container">
          <h1>{N.title}</h1>
          <p>{N.subtitle}</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div className="category-filters">
          {CAT_KEYS.map(c => (
            <button key={c} className={`filter-btn${category === c ? ' active' : ''}`} onClick={() => setCategory(c)}>
              {N.cats[c]}
            </button>
          ))}
        </div>

        {loading && <NewsSkeleton />}

        {error && !loading && (
          <div className="state-box">
            <h3>{N.errorTitle}</h3>
            <p>{error}</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>{N.errorSub}</p>
          </div>
        )}
        {!loading && !error && articles.length === 0 && (
          <div className="state-box">
            <h3>{N.noArticles}</h3>
            <p>{N.noArticlesSub}</p>
          </div>
        )}
        {!loading && !error && articles.length > 0 && (
          <div>
            {articles.map((article, i) => (
              <React.Fragment key={article.link || i}>
                {i === 4 && <InlineCTA />}
                <article className="news-article">
                  <div className="article-meta">
                    <span className={`tag tag-${article.category || 'other'}`}>{N.cats[article.category] || article.category}</span>
                    <span className="article-source">{article.source}</span>
                    <span className="article-source">&middot; {article.date}</span>
                  </div>
                  <h2 className="article-headline">{article.headline || article.title}</h2>
                  <p className="article-summary">{article.summary || article.content?.slice(0, 200)}</p>
                  <div className="article-footer">
                    <div>
                      {article.link && (
                        <a href={article.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                          {N.readMore}
                        </a>
                      )}
                    </div>
                    <ShareMenu article={article} />
                  </div>
                </article>
              </React.Fragment>
            ))}
            {articles.length <= 4 && <InlineCTA />}
          </div>
        )}
      </div>
    </div>
  );
}
