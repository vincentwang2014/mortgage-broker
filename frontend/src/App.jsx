import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { translations } from './lib/i18n.js';
import HomePage from './pages/HomePage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import NewsPage from './pages/NewsPage.jsx';
import QuotePage from './pages/QuotePage.jsx';
import PreQualPage from './pages/PreQualPage.jsx';
import CalcPage from './pages/CalcPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

export const LangContext = createContext({ lang: 'en', T: translations.en, setLang: () => {} });
export function useLang() { return useContext(LangContext); }

function Nav() {
  const { lang, setLang, T } = useLang();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const links = [
    { to: '/', label: T.nav.home, end: true },
    { to: '/news', label: T.nav.news },
    { to: '/calc', label: T.nav.calc },
    { to: '/chat', label: T.nav.chat },
    { to: '/quote', label: T.nav.quote },
    { to: '/prequal', label: T.nav.prequal, cta: true },
  ];

  return (
    <>
      <nav className={`nav${scrolled ? ' nav-scrolled' : ''}`}>
        <div className="nav-inner">
          <Link to="/" className="nav-brand">
            <svg className="nav-brand-icon" viewBox="0 0 480 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="navGrad" x1="0" y1="0" x2="480" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#1D4ED8"/>
                  <stop offset="52%" stopColor="#2563EB"/>
                  <stop offset="100%" stopColor="#2EC4B6"/>
                </linearGradient>
              </defs>
              <g stroke="url(#navGrad)" strokeWidth="36" fill="none">
                <rect x="38" y="24" width="104" height="132" rx="24"/>
                <rect x="188" y="24" width="104" height="132" rx="24"/>
                <rect x="338" y="24" width="104" height="132" rx="24"/>
              </g>
              <g fill="url(#navGrad)">
                <rect x="77" y="58" width="26" height="26" rx="6"/>
                <rect x="77" y="96" width="26" height="26" rx="6"/>
                <rect x="228" y="58" width="24" height="64" rx="12"/>
                <rect x="378" y="58" width="24" height="64" rx="12"/>
              </g>
            </svg>
            <span className="nav-brand-wordmark">
              <span className="nav-brand-num">800</span>
              <span className="nav-brand-text">Home Loan</span>
            </span>
          </Link>
          <div className="nav-links">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => `nav-link${l.cta ? ' nav-cta' : ''}${isActive ? ' active' : ''}`}
              >
                {l.label}
              </NavLink>
            ))}
            <button
              className="lang-toggle"
              onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
              title={lang === 'en' ? '切换中文' : 'Switch to English'}
            >
              {lang === 'en' ? '中文' : 'EN'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className={`hamburger${open ? ' open' : ''}`}
              onClick={() => setOpen(v => !v)}
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>
      <div className={`mobile-menu${open ? ' open' : ''}`}>
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => `mobile-link${isActive ? ' active' : ''}`}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </NavLink>
        ))}
        <button
          className="mobile-link"
          style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)' }}
          onClick={() => { setLang(lang === 'en' ? 'zh' : 'en'); setOpen(false); }}
        >
          {lang === 'en' ? '切换中文' : 'Switch to English'}
        </button>
      </div>
    </>
  );
}

export default function App() {
  const [lang, setLang] = useState('en');
  const T = translations[lang];

  return (
    <LangContext.Provider value={{ lang, T, setLang }}>
      <Nav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/quote" element={<QuotePage />} />
        <Route path="/prequal" element={<PreQualPage />} />
        <Route path="/calc" element={<CalcPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <footer className="footer">
        <div className="footer-wordmark">
          <svg className="nav-brand-icon" viewBox="0 0 480 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="footerGrad" x1="0" y1="0" x2="480" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1D4ED8"/>
                <stop offset="52%" stopColor="#2563EB"/>
                <stop offset="100%" stopColor="#2EC4B6"/>
              </linearGradient>
            </defs>
            <g stroke="url(#footerGrad)" strokeWidth="36" fill="none">
              <rect x="38" y="24" width="104" height="132" rx="24"/>
              <rect x="188" y="24" width="104" height="132" rx="24"/>
              <rect x="338" y="24" width="104" height="132" rx="24"/>
            </g>
            <g fill="url(#footerGrad)">
              <rect x="77" y="58" width="26" height="26" rx="6"/>
              <rect x="77" y="96" width="26" height="26" rx="6"/>
              <rect x="228" y="58" width="24" height="64" rx="12"/>
              <rect x="378" y="58" width="24" height="64" rx="12"/>
            </g>
          </svg>
          <span className="nav-brand-wordmark">
            <span className="nav-brand-num">800</span>
            <span className="nav-brand-text">Home Loan</span>
          </span>
        </div>
        <p style={{ marginTop: '0.5rem' }}>{T.footer}</p>
        <p style={{ marginTop: '0.25rem' }}>{T.footerSub}</p>
      </footer>
    </LangContext.Provider>
  );
}
