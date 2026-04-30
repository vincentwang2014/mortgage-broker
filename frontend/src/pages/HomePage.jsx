import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../App.jsx';

function SubscribeModal({ onClose }) {
  const { T } = useLang();
  const M = T.modal;
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch { setStatus('error'); }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>&#x2715;</button>
        <h3>{M.title}</h3>
        <p>{M.sub}</p>
        {status === 'success' ? (
          <div className="state-box">
            <h3>{M.successTitle}</h3>
            <p>{M.successSub}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="form-group">
              <label className="form-label">{M.nameLabel}</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder={M.namePlaceholder} />
            </div>
            <div className="form-group">
              <label className="form-label">{M.emailLabel}</label>
              <input className="form-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={M.emailPlaceholder} />
            </div>
            {status === 'error' && <p style={{ color: 'red', fontSize: '0.82rem' }}>{M.error}</p>}
            <button className="btn btn-primary" disabled={status === 'loading'}>
              {status === 'loading' ? M.submitting : M.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { T } = useLang();
  const H = T.home;
  const [showModal, setShowModal] = useState(false);
  const [subEmail, setSubEmail] = useState('');
  const [subStatus, setSubStatus] = useState('idle');

  async function handleInlineSubscribe(e) {
    e.preventDefault();
    setSubStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subEmail }),
      });
      if (!res.ok) throw new Error();
      setSubStatus('success');
    } catch { setSubStatus('error'); }
  }

  function share(platform) {
    const url = window.location.origin;
    const text = 'Get expert mortgage guidance and AI-powered tools at ClearPath Mortgage.';
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    if (platform === 'copy') navigator.clipboard.writeText(url);
  }

  return (
    <div className="page">
      <section className="hero">
        <div className="container">
          <h1>{H.heroTitle1}<span>{H.heroHighlight}</span>{H.heroTitle2}</h1>
          <p>{H.heroSub}</p>
          <div className="hero-actions">
            <Link to="/quote" className="btn btn-gold btn-lg">{H.ctaQuote}</Link>
            <Link to="/chat" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
              {H.ctaChat}
            </Link>
          </div>
        </div>
      </section>

      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-number">{H.stat1}</div>
          <div className="stat-label">{H.stat1Label}</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{H.stat2}</div>
          <div className="stat-label">{H.stat2Label}</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{H.stat3}</div>
          <div className="stat-label">{H.stat3Label}</div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <h2 style={{ marginBottom: '0.5rem' }}>{H.servicesTitle}</h2>
          <p style={{ marginBottom: '2rem' }}>{H.servicesSub}</p>
          <div className="card-grid card-grid-3">
            {H.services.map(s => (
              <div key={s.title} className="card">
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{s.icon}</div>
                <h3 style={{ marginBottom: '0.5rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.875rem' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="newsletter-banner">
        <div className="container">
          <h2>{H.newsletterTitle}</h2>
          <p>{H.newsletterSub}</p>
          {subStatus === 'success' ? (
            <p style={{ color: '#c9a96e', fontWeight: 500 }}>{H.subscribeSuccess}</p>
          ) : (
            <form className="subscribe-form" onSubmit={handleInlineSubscribe}>
              <input
                className="form-input"
                type="email"
                required
                value={subEmail}
                onChange={e => setSubEmail(e.target.value)}
                placeholder={H.emailPlaceholder}
              />
              <button className="btn btn-gold" disabled={subStatus === 'loading'}>
                {subStatus === 'loading' ? H.subscribing : H.subscribeFree}
              </button>
            </form>
          )}
          {subStatus === 'error' && <p style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '0.5rem' }}>{H.subscribeError}</p>}
          <button
            onClick={() => setShowModal(true)}
            style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', marginTop: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {H.addName}
          </button>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '0.875rem', fontSize: '0.85rem' }}>{H.shareText}</p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={() => share('twitter')}>{H.shareX}</button>
            <button className="btn btn-outline btn-sm" onClick={() => share('facebook')}>{H.shareFacebook}</button>
            <button className="btn btn-outline btn-sm" onClick={() => share('copy')}>{H.copyLink}</button>
          </div>
        </div>
      </section>

      {showModal && <SubscribeModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
