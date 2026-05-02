import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShieldCheck, Users, CheckCircle2, BadgeCheck, Brain, FileCheck2, Home as HomeIcon, ChevronRight } from 'lucide-react';
import { useLang } from '../App.jsx';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const HOW_ICONS = [HomeIcon, Brain, FileCheck2];

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
  const navigate = useNavigate();
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
          <div className="hero-grid">

            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="hero-col-left"
            >
              <motion.div variants={fadeUp} className="hero-badge">{H.heroBadge}</motion.div>
              <motion.h1 variants={fadeUp}>
                {H.heroTitle1}<span>{H.heroHighlight}</span>{H.heroTitle2}
              </motion.h1>
              <motion.p variants={fadeUp} className="hero-subtitle">{H.heroSub}</motion.p>
              <motion.div variants={fadeUp} className="hero-actions">
                <Link to="/prequal" className="btn btn-gold btn-lg btn-hero-primary">
                  {H.ctaQuote} <ArrowRight size={20} />
                </Link>
                <Link to="/chat" className="btn btn-hero-secondary btn-lg">
                  {H.ctaChat} <Sparkles size={20} />
                </Link>
              </motion.div>
              <motion.div variants={fadeUp} className="hero-trust">
                {[ShieldCheck, Users, CheckCircle2].map((Icon, i) => (
                  <div key={i} className="trust-item">
                    <Icon size={15} />
                    {H.trustItems[i].replace(/^✓\s*/, '')}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className="hero-col-right"
            >
              <div className="hero-brand-card-glow" />
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="hero-brand-card">
                  <img src="/logos/svg/logo-stacked-width-locked-transparent.svg" alt="800 Home Loan" className="hero-card-logo" />
                  <div className="hero-card-stats">
                    <div>
                      <span className="hero-card-stat-num">{H.stat1}</span>
                      <span className="hero-card-stat-label">{H.stat1Label}</span>
                    </div>
                    <div>
                      <span className="hero-card-stat-num">{H.stat2}</span>
                      <span className="hero-card-stat-label">{H.stat2Label}</span>
                    </div>
                    <div>
                      <span className="hero-card-stat-num">{H.stat3}</span>
                      <span className="hero-card-stat-label">{H.stat3Label}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <div className="trust-bar">
        <div className="trust-bar-inner">
          {H.trustBarItems.map(item => (
            <div key={item} className="trust-bar-item">
              <BadgeCheck size={16} style={{ color: 'var(--teal)', flexShrink: 0 }} />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── Credentials ── */}
      <section className="credentials-section">
        <div className="container">
          <div className="credentials-grid">
            <div className="credential-card">
              <ShieldCheck size={22} className="credential-icon" />
              <div>
                <div className="credential-label">{H.credentialItems[0].label}</div>
                <div className="credential-value">{H.credentialItems[0].value}</div>
              </div>
            </div>
            <div className="credential-card">
              <BadgeCheck size={22} className="credential-icon" />
              <div>
                <div className="credential-label">{H.credentialItems[1].label}</div>
                <div className="credential-value">{H.credentialItems[1].value}</div>
              </div>
            </div>
            <div className="credential-card">
              <Users size={22} className="credential-icon" />
              <div>
                <div className="credential-label">{H.credentialItems[2].label}</div>
                <div className="credential-value">{H.credentialItems[2].value}</div>
              </div>
            </div>
          </div>
          <p className="credentials-disclaimer">{H.credentialsDisclaimer}</p>
        </div>
      </section>

      {/* ── How It Works ── */}
      <motion.section
        id="how-it-works"
        className="how-section"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-120px' }}
        variants={stagger}
      >
        <div className="container">
          <motion.div variants={fadeUp} className="how-intro">
            <span className="section-eyebrow-teal">{H.stepsEyebrow}</span>
            <h2>{H.stepsTitle}</h2>
            <p className="how-sub">{H.howSub}</p>
          </motion.div>
          <div className="how-cards">
            {H.steps.map((s, i) => {
              const Icon = HOW_ICONS[i];
              return (
                <motion.div key={s.num} variants={fadeUp} className="how-card">
                  <div className="how-card-icon">
                    <Icon size={24} />
                  </div>
                  <div className="how-card-num">0{i + 1}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ── Why 800 ── */}
      <section id="why-why" className="why-section">
        <div className="container">
          <div className="why-grid">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.span variants={fadeUp} className="section-eyebrow-teal">Why 800 Home Loan</motion.span>
              <motion.h2 variants={fadeUp}>{H.whyTitle}</motion.h2>
              <motion.p variants={fadeUp} className="why-sub">{H.whySub}</motion.p>
            </motion.div>
            <div className="why-cards">
              {H.whyItems.map(([title, text, src]) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55 }}
                  className="why-card"
                >
                  <img src={src} alt="" width={48} height={48} />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Rate Quote ── */}
      <section id="rate-quote" className="rate-section">
        <div className="container">
          <div className="rate-card">
            <div>
              <span className="section-eyebrow-teal">Rate Quote</span>
              <h2>{H.rateTitle}</h2>
              <p className="rate-sub">{H.rateSub}</p>
              <div className="rate-checklist">
                {H.rateChecklist.map(item => (
                  <div key={item} className="rate-check-item">
                    <CheckCircle2 size={18} style={{ color: 'var(--teal)', flexShrink: 0 }} />{item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rate-form-inner">
              <div className="rate-form-fields">
                {['Loan purpose', 'Property ZIP code', 'Estimated home price', 'Credit score range'].map((label, i) => (
                  <div key={label} className="form-group">
                    <label className="form-label rate-form-label">{label}</label>
                    <input
                      className="form-input rate-form-input"
                      placeholder={i === 1 ? '90245' : i === 2 ? '$800,000' : 'Select option'}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/quote')}
                className="btn btn-gold btn-lg"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
              >
                {H.ctaQuote} <ArrowRight size={20} />
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.75rem' }}>
                Takes less than 2 minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Advisor ── */}
      <section id="ai-advisor" className="ai-section">
        <div className="container">
          <div className="ai-grid">
            <div>
              <span className="section-eyebrow-teal">AI Advisor</span>
              <h2>{H.aiTitle}</h2>
              <p className="ai-sub">{H.aiSub}</p>
              <Link to="/chat" className="btn btn-hero-secondary btn-lg" style={{ marginTop: '2rem', display: 'inline-flex' }}>
                Talk to AI Advisor <ChevronRight size={20} />
              </Link>
            </div>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="ai-chat-card"
            >
              <div className="ai-chat-inner">
                <div className="ai-chat-header">
                  <img src="/icons/svg/icon-ai-driven.svg" alt="" width={40} height={40} />
                  <div>
                    <div className="ai-chat-name">800 AI Advisor</div>
                    <div className="ai-chat-sub">Mortgage guidance assistant</div>
                  </div>
                </div>
                <div className="ai-messages">
                  <div className="ai-message-user">{H.aiChatUser}</div>
                  <div className="ai-message-bot">{H.aiChatBot}</div>
                </div>
              </div>
            </motion.div>
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
            <p style={{ color: 'var(--teal)', fontWeight: 500 }}>{H.subscribeSuccess}</p>
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
            <Link to="/prequal" className="btn btn-gold btn-lg">{H.ctaQuote}</Link>
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
