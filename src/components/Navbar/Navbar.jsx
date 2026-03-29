import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchMarketData } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const [marketData, setMarketData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();

  const NAV_LINKS = [
    { to: '/', label: t('home') },
    { to: '/category/markets', label: t('markets') },
    { to: '/category/industry', label: t('industry') },
    { to: '/category/tech', label: t('tech') },
    { to: '/category/economy', label: t('economy') },
    { to: '/category/wealth', label: t('wealth') },
    { to: '/category/startups', label: t('startups') },
    { to: '/category/politics', label: t('politics') },
    { to: '/story-arc', label: t('storyArc') },
    { to: '/news-navigator', label: t('newsNavigator') },
    { to: '/my-et', label: t('myET'), highlight: true },
  ];

  useEffect(() => {
    fetchMarketData()
      .then(setMarketData)
      .catch(() => setMarketData([]));
  }, []);

  return (
    <header className="navbar">
      {/* Top Bar */}
      <div className="navbar-top">
        <Link to="/" className="navbar-logo">
          <div>
            <span>The Economic</span>
            <span className="logo-accent"> Times</span>
            <span className="logo-sub">AI-Powered News Experience</span>
          </div>
        </Link>

        <div className="navbar-actions">
          <div className="navbar-search">
            <i className="bi bi-search navbar-search-icon"></i>
            <input
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Language Switcher — Vernacular Engine */}
          <LanguageSwitcher />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="navbar-nav">
        <div className="navbar-nav-inner">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? 'active' : ''} ${link.highlight ? 'highlight' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Market Ticker */}
      {marketData.length > 0 && (
        <div className="market-ticker">
          <div className="ticker-label">
            <span className="ticker-dot"></span>
            {t('live')}
          </div>
          <div className="ticker-track">
            <div className="ticker-content">
              {[...marketData, ...marketData].map((item, i) => (
                <div className="ticker-item" key={`${item.id}-${i}`}>
                  <span className="ticker-item-name">{item.name}</span>
                  <span className="ticker-item-value">
                    {item.value.toLocaleString('en-IN', {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className={`ticker-item-change ${item.trend}`}>
                    {item.trend === 'up' ? '▲' : '▼'}{' '}
                    {Math.abs(item.changePercent).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
