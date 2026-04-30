import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function SubscribeModal({ onClose }) {
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
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>&#x2715;</button>
        <h3>Subscribe to Weekly Updates</h3>
        <p>Rate movements, market trends, and guideline updates — every Tuesday morning.</p>
        {status === 'success' ? (
          <div className="state-box">
            <h3>You're in!</h3>
            <p>Check your inbox for a welcome email.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="form-group">
              <label className="form-label">Name (optional)</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="First name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            {status === 'error' && <p style={{ color: 'red', fontSize: '0.82rem' }}>Something went wrong. Try again.</p>}
            <button className="btn btn-primary" disabled={status === 'loading'}>
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const SERVICES = [
  {
    icon: '🏠',
    title: 'Purchase Loans',
    desc: 'First-time buyer or move-up, we navigate conventional, FHA, VA, and jumbo to find your best fit.',
  },
  {
    icon: '🔄',
    title: 'Refinance',
    desc: 'Lower your rate, reduce your term, or tap equity. We run the numbers so you know exactly when it makes sense.',
  },
  {
    icon: '📊',
    title: 'Investment Property',
    desc: 'DSCR, conventional, and portfolio programs for buy-and-hold, BRRRR, and short-term rentals.',
  },
  {
    icon: '🤖',
    title: 'AI Mortgage Advisor',
    desc: 'Get instant answers to your mortgage questions — loan programs, guidelines, qualification estimates.',
  },
];

export default function HomePage() {
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
    } catch {
      setSubStatus('error');
    }
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
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1>Your <span>ClearPath</span> to Homeownership</h1>
          <p>Licensed California mortgage broker — expert guidance, AI-powered tools, and rates from 40+ lenders.</p>
          <div className="hero-actions">
            <Link to="/quote" className="btn btn-gold btn-lg">Get a Rate Quote</Link>
            <Link to="/chat" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
              Ask AI Advisor
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-number">40+</div>
          <div className="stat-label">Lender Partners</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">$806K</div>
          <div className="stat-label">2025 Conforming Limit</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">620+</div>
          <div className="stat-label">Min Credit Score</div>
        </div>
      </div>

      {/* Services */}
      <section className="section">
        <div className="container">
          <h2 style={{ marginBottom: '0.5rem' }}>How We Help</h2>
          <p style={{ marginBottom: '2rem' }}>From first-time buyers to seasoned investors — we have the programs and expertise.</p>
          <div className="card-grid card-grid-3">
            {SERVICES.map(s => (
              <div key={s.title} className="card">
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{s.icon}</div>
                <h3 style={{ marginBottom: '0.5rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.875rem' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Banner */}
      <section className="newsletter-banner">
        <div className="container">
          <h2>Stay Ahead of the Market</h2>
          <p>Weekly rate intelligence, market trends, and guideline updates — in under 3 minutes.</p>
          {subStatus === 'success' ? (
            <p style={{ color: '#c9a96e', fontWeight: 500 }}>You're subscribed! Check your inbox.</p>
          ) : (
            <form className="subscribe-form" onSubmit={handleInlineSubscribe}>
              <input
                className="form-input"
                type="email"
                required
                value={subEmail}
                onChange={e => setSubEmail(e.target.value)}
                placeholder="Enter your email"
              />
              <button className="btn btn-gold" disabled={subStatus === 'loading'}>
                {subStatus === 'loading' ? 'Subscribing...' : 'Subscribe Free'}
              </button>
            </form>
          )}
          {subStatus === 'error' && <p style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '0.5rem' }}>Something went wrong. Try again.</p>}
          <button
            onClick={() => setShowModal(true)}
            style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', marginTop: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Want to add your name too?
          </button>
        </div>
      </section>

      {/* Social Share */}
      <section className="section" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '0.875rem', fontSize: '0.85rem' }}>Know someone buying a home? Share ClearPath Mortgage.</p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={() => share('twitter')}>Share on X</button>
            <button className="btn btn-outline btn-sm" onClick={() => share('facebook')}>Share on Facebook</button>
            <button className="btn btn-outline btn-sm" onClick={() => share('copy')}>Copy Link</button>
          </div>
        </div>
      </section>

      {showModal && <SubscribeModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
