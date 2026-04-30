import React, { useState } from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import NewsPage from './pages/NewsPage.jsx';
import QuotePage from './pages/QuotePage.jsx';

function Nav() {
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/', label: 'Home', end: true },
    { to: '/news', label: 'Market News' },
    { to: '/chat', label: 'AI Advisor' },
    { to: '/quote', label: 'Get a Quote', cta: true },
  ];

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link to="/" className="nav-brand">ClearPath Mortgage</Link>
          <div className="nav-links">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `nav-link${l.cta ? ' nav-cta' : ''}${isActive ? ' active' : ''}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
          <button
            className={`hamburger${open ? ' open' : ''}`}
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
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
      </div>
    </>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/quote" element={<QuotePage />} />
      </Routes>
      <footer className="footer">
        <p>ClearPath Mortgage &mdash; Licensed California Mortgage Broker &mdash; NMLS #______</p>
        <p style={{ marginTop: '0.25rem' }}>Not a commitment to lend. Equal Housing Lender.</p>
      </footer>
    </>
  );
}
