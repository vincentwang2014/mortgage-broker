import React, { useState, createContext, useContext } from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { translations } from './lib/i18n.js';
import HomePage from './pages/HomePage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import NewsPage from './pages/NewsPage.jsx';
import QuotePage from './pages/QuotePage.jsx';
import CalcPage from './pages/CalcPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

export const LangContext = createContext({ lang: 'en', T: translations.en, setLang: () => {} });
export function useLang() { return useContext(LangContext); }

function Nav() {
  const { lang, setLang, T } = useLang();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/', label: T.nav.home, end: true },
    { to: '/news', label: T.nav.news },
    { to: '/calc', label: T.nav.calc },
    { to: '/chat', label: T.nav.chat },
    { to: '/quote', label: T.nav.quote, cta: true },
  ];

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link to="/" className="nav-brand">{T.nav.brand}</Link>
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
          style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)' }}
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
        <Route path="/calc" element={<CalcPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <footer className="footer">
        <p>{T.footer}</p>
        <p style={{ marginTop: '0.25rem' }}>{T.footerSub}</p>
      </footer>
    </LangContext.Provider>
  );
}
