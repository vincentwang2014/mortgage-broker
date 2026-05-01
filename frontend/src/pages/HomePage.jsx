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

  return (
    <div className="page">

      {/* ── Hero ── */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge">{H.heroBadge}</div>
          <h1>{H.heroTitle1}<span>{H.heroHighlight}</span>{H.heroTitle2}</h1>
          <p>{H.heroSub}</p>
          <div className="hero-actions">
            <Link to="/quote" className="btn btn-gold btn-lg">{H.ctaQuote}</Link>
            <Link to="/chat" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
              {H.ctaChat}
            </Link>
          </div>
          <div className="hero-trust">
            {H.trustItems.map(t => <span key={t} className="trust-item">{t}</span>)}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
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

      {/* ── Services ── */}
      <section className="section">
        <div className="container">
          <h2 style={{ marginBottom: '0.5rem' }}>{H.servicesTitle}</h2>
          <p style={{ marginBottom: '2rem' }}>{H.servicesSub}</p>
          <div className="card-grid card-grid-3">
            {H.services.map(s => (
              <div key={s.title} className="card">
                <div className="service-icon">{s.icon}</div>
                <h3 style={{ marginBottom: '0.5rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.875rem' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="section" style={{ background: 'var(--white)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="section-eyebrow">{H.stepsEyebrow}</span>
            <h2 style={{ marginTop: '0.5rem' }}>{H.stepsTitle}</h2>
          </div>
          <div className="steps-grid">
            {H.steps.map(s => (
              <div key={s.num} className="step">
                <div className="step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="section-eyebrow">{H.testimonialsEyebrow}</span>
            <h2 style={{ marginTop: '0.5rem' }}>{H.testimonialsTitle}</h2>
          </div>
          <div className="testimonials-grid">
            {H.testimonials.map(t => (
              <div key={t.name} className="testimonial">
                <div className="testimonial-quote">"</div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">{t.name}</div>
                <div className="testimonial-loc">{t.loc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
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

      {/* ── Bottom CTA ── */}
      <section className="cta-bottom">
        <div className="container">
          <h2>{H.ctaBottomTitle}</h2>
          <p>{H.ctaBottomSub}</p>
          <div className="hero-actions">
            <Link to="/quote" className="btn btn-gold btn-lg">{H.ctaQuote}</Link>
            <Link to="/chat" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
              {H.ctaChat}
            </Link>
          </div>
        </div>
      </section>

      {showModal && <SubscribeModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
