import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchMarketData } from '../../api';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/category/markets', label: 'Markets' },
  { to: '/category/industry', label: 'Industry' },
  { to: '/category/tech', label: 'Tech' },
  { to: '/category/economy', label: 'Economy' },
  { to: '/category/wealth', label: 'Wealth' },
  { to: '/category/startups', label: 'Startups' },
  { to: '/category/politics', label: 'Politics' },
  { to: '/my-et', label: 'My ET', highlight: true },
];

export default function Navbar() {
  const location = useLocation();
  const [marketData, setMarketData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

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
            <span className="navbar-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Vernacular Engine placeholder */}
          <button className="lang-selector" title="Language — Vernacular Engine integration slot">
            🌐 EN ▾
          </button>
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
            LIVE
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
