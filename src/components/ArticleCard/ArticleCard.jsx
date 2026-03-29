import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import './ArticleCard.css';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Category name translations
const CATEGORY_TRANSLATIONS = {
  hi: { 'Markets': 'बाज़ार', 'Industry': 'उद्योग', 'Tech': 'टेक', 'Wealth': 'सम्पत्ति', 'Economy': 'अर्थव्यवस्था', 'Politics': 'राजनीति', 'Top Stories': 'मुख्य खबरें', 'Startups': 'स्टार्टअप' },
  ta: { 'Markets': 'சந்தைகள்', 'Industry': 'தொழில்', 'Tech': 'தொழில்நுட்பம்', 'Wealth': 'செல்வம்', 'Economy': 'பொருளாதாரம்', 'Politics': 'அரசியல்', 'Top Stories': 'முக்கிய செய்திகள்', 'Startups': 'ஸ்டார்ட்அப்' },
  te: { 'Markets': 'మార్కెట్లు', 'Industry': 'పరిశ్రమ', 'Tech': 'టెక్', 'Wealth': 'సంపద', 'Economy': 'ఆర్థిక వ్యవస్థ', 'Politics': 'రాజకీయాలు', 'Top Stories': 'ముఖ్య వార్తలు', 'Startups': 'స్టార్టప్‌లు' },
};

const CATEGORY_ICONS = {
  'Markets': '📈', 'Industry': '🏭', 'Tech': '💻',
  'Wealth': '💰', 'Economy': '🏦', 'Politics': '🏛️',
  'Top Stories': '📰', 'Startups': '🚀',
};

export default function ArticleCard({ article, horizontal = false }) {
  const { language, t } = useLanguage();

  const categoryDisplay = language !== 'en' && CATEGORY_TRANSLATIONS[language]
    ? (CATEGORY_TRANSLATIONS[language][article.category] || article.category)
    : article.category;

  const hasImage = !!article.imageUrl;

  return (
    <Link to={`/article/${article.id}`} className={`article-card ${horizontal ? 'horizontal' : ''}`}>
      <div className="article-card-image">
        {hasImage ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling?.classList.add('visible');
            }}
          />
        ) : null}
        <div className={`article-card-placeholder${!hasImage ? ' visible' : ''}`}>
          <span>{CATEGORY_ICONS[article.category] || '📰'}</span>
          <p>{article.category}</p>
        </div>
        <div className="card-badges">
          <span className={`category-badge ${article.category.toLowerCase()}`}>
            {categoryDisplay}
          </span>
        </div>
      </div>

      <div className="article-card-body">
        <h3 className="article-card-title">{article.title}</h3>
        <p className="article-card-summary">{article.summary}</p>
        <div className="article-card-meta">
          <span className="article-card-author">{article.author}</span>
          <span className="article-card-time">
            <i className="bi bi-clock"></i> {article.readTime} {t('minRead')} · {timeAgo(article.publishedAt)}
          </span>
        </div>
      </div>

      <div className="article-card-actions">
        <button
          className="card-action-btn"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = '/story-arc';
          }}
          title="Story Arc Tracker"
        >
          <i className="bi bi-diagram-3"></i> {t('trackStory')}
        </button>
        <button className="card-action-btn" onClick={(e) => e.preventDefault()} title="News Navigator">
          <i className="bi bi-stars"></i> {t('aiBriefing')}
        </button>
      </div>
    </Link>
  );
}
