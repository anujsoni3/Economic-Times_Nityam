import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import './Footer.css';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="footer-brand-name">
            The Economic<span className="accent"> Times</span>
          </div>
          <p className="footer-brand-desc">
            {t('footerDesc')}
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
          <h4>{t('news')}</h4>
          <ul>
            <li><Link to="/category/markets">{t('markets')}</Link></li>
            <li><Link to="/category/industry">{t('industry')}</Link></li>
            <li><Link to="/category/tech">{t('tech')}</Link></li>
            <li><Link to="/category/economy">{t('economy')}</Link></li>
            <li><Link to="/category/politics">{t('politics')}</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>{t('investing')}</h4>
          <ul>
            <li><Link to="/category/wealth">{t('wealth')}</Link></li>
            <li><Link to="/category/markets">{t('mutualFunds')}</Link></li>
            <li><Link to="/category/startups">{t('startups')}</Link></li>
            <li><a href="#">{t('ipo')}</a></li>
            <li><a href="#">{t('commodities')}</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>{t('aiFeatures')}</h4>
          <ul>
            <li><Link to="/my-et">{t('myET')}</Link></li>
            <li><Link to="/news-navigator">{t('newsNavigator')}</Link></li>
            <li><Link to="/video/1">AI Video Studio</Link></li>
            <li><Link to="/story-arc">{t('storyArc')}</Link></li>
            <li><a href="#">{t('vernacularEngine')}</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        {t('footerCopy')}
      </div>
    </footer>
  );
}
