import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="footer-brand-name">
            The Economic<span className="accent"> Times</span>
          </div>
          <p className="footer-brand-desc">
            India's leading financial newspaper. Bringing you the most comprehensive business news,
            market analysis, and expert opinions — now powered by AI.
          </p>
          <div className="footer-hackathon-badge">
            🤖 ET GenAI Hackathon 2026
          </div>
          <div className="footer-social">
            <a href="#" title="Twitter">𝕏</a>
            <a href="#" title="LinkedIn">in</a>
            <a href="#" title="YouTube">▶</a>
            <a href="#" title="Instagram">📷</a>
          </div>
        </div>

        <div className="footer-column">
          <h4>News</h4>
          <ul>
            <li><Link to="/category/markets">Markets</Link></li>
            <li><Link to="/category/industry">Industry</Link></li>
            <li><Link to="/category/tech">Tech</Link></li>
            <li><Link to="/category/economy">Economy</Link></li>
            <li><Link to="/category/politics">Politics</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Investing</h4>
          <ul>
            <li><Link to="/category/wealth">Wealth</Link></li>
            <li><Link to="/category/markets">Mutual Funds</Link></li>
            <li><Link to="/category/startups">Startups</Link></li>
            <li><a href="#">IPO</a></li>
            <li><a href="#">Commodities</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>AI Features</h4>
          <ul>
            <li><Link to="/my-et">My ET — Personalized</Link></li>
            <li><Link to="/briefing/test">News Navigator</Link></li>
            <li><Link to="/video/1">AI Video Studio</Link></li>
            <li><Link to="/story-arc/test">Story Arc Tracker</Link></li>
            <li><a href="#">Vernacular Engine</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 The Economic Times — ET GenAI Hackathon. Built with ❤️ for the future of news.
      </div>
    </footer>
  );
}
