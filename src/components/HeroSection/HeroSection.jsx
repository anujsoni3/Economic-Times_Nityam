import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import './HeroSection.css';

const CATEGORY_TRANSLATIONS = {
  hi: { 'Markets': 'बाज़ार', 'Industry': 'उद्योग', 'Tech': 'टेक', 'Wealth': 'सम्पत्ति', 'Economy': 'अर्थव्यवस्था', 'Politics': 'राजनीति', 'Top Stories': 'मुख्य खबरें' },
  ta: { 'Markets': 'சந்தைகள்', 'Industry': 'தொழில்', 'Tech': 'தொழில்நுட்பம்', 'Wealth': 'செல்வம்', 'Economy': 'பொருளாதாரம்', 'Politics': 'அரசியல்', 'Top Stories': 'முக்கிய செய்திகள்' },
  te: { 'Markets': 'మార్కెట్లు', 'Industry': 'పరిశ్రమ', 'Tech': 'టెక్', 'Wealth': 'సంపద', 'Economy': 'ఆర్థిక వ్యవస్థ', 'Politics': 'రాజకీయాలు', 'Top Stories': 'ముఖ్య వార్తలు' },
};

const BREAKING_TRANSLATIONS = { hi: 'ताज़ा ख़बर', ta: 'முக்கிய செய்தி', te: 'తాజా వార్త' };

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const CATEGORY_ICONS = {
  'Markets': '📈', 'Industry': '🏭', 'Tech': '💻',
  'Wealth': '💰', 'Economy': '🏦', 'Politics': '🏛️',
  'Top Stories': '📰', 'Startups': '🚀',
};

export default function HeroSection({ articles }) {
  const { language, t } = useLanguage();

  if (!articles || articles.length === 0) return null;

  const mainArticle = articles[0];
  const sideArticles = articles.slice(1, 5);

  const getCategoryDisplay = (category) => {
    if (language !== 'en' && CATEGORY_TRANSLATIONS[language]) {
      return CATEGORY_TRANSLATIONS[language][category] || category;
    }
    return category;
  };

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-grid">
          {/* Main Hero */}
          <Link to={`/article/${mainArticle.id}`} className="hero-main">
            <div className="hero-main-image">
              {mainArticle.imageUrl ? (
                <img
                  src={mainArticle.imageUrl}
                  alt={mainArticle.title}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling?.classList.add('visible');
                  }}
                />
              ) : null}
              <div className={`hero-image-placeholder${!mainArticle.imageUrl ? ' visible' : ''}`}>
                <span>{CATEGORY_ICONS[mainArticle.category] || '📰'}</span>
              </div>
            </div>
            <div className="hero-main-overlay" />
            <div className="hero-main-content">
              <div className="hero-main-badges">
                <span className="hero-breaking-badge">
                  <span className="ticker-dot"></span>
                  {BREAKING_TRANSLATIONS[language] || 'BREAKING'}
                </span>
                <span className={`category-badge ${mainArticle.category.toLowerCase()}`}>
                  {getCategoryDisplay(mainArticle.category)}
                </span>
              </div>
              <h1 className="hero-main-title">{mainArticle.title}</h1>
              <p className="hero-main-summary">{mainArticle.summary}</p>
              <div className="hero-main-meta">
                <span>{mainArticle.author}</span>
                <span>·</span>
                <span>{mainArticle.readTime} {t('minRead')}</span>
                <span>·</span>
                <span>{timeAgo(mainArticle.publishedAt)}</span>
              </div>
            </div>
          </Link>

          {/* Side Stories */}
          <div className="hero-side">
            {sideArticles.map((article, i) => (
              <Link
                key={article.id}
                to={`/article/${article.id}`}
                className="hero-side-card"
              >
                <span className="hero-side-number">
                  {String(i + 2).padStart(2, '0')}
                </span>
                <div className="hero-side-content">
                  <div className={`hero-side-category category-badge ${article.category.toLowerCase()}`}>
                    {getCategoryDisplay(article.category)}
                  </div>
                  <h3 className="hero-side-title">{article.title}</h3>
                  <span className="hero-side-time">
                    {timeAgo(article.publishedAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
