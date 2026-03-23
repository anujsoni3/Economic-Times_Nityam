import { Link } from 'react-router-dom';
import './HeroSection.css';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function HeroSection({ articles }) {
  if (!articles || articles.length === 0) return null;

  const mainArticle = articles[0];
  const sideArticles = articles.slice(1, 5);

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-grid">
          {/* Main Hero */}
          <Link to={`/article/${mainArticle.id}`} className="hero-main">
            <div className="hero-main-image">
              <img src={mainArticle.imageUrl} alt={mainArticle.title} />
            </div>
            <div className="hero-main-overlay" />
            <div className="hero-main-content">
              <div className="hero-main-badges">
                <span className="hero-breaking-badge">
                  <span className="ticker-dot"></span>
                  BREAKING
                </span>
                <span className={`category-badge ${mainArticle.category.toLowerCase()}`}>
                  {mainArticle.category}
                </span>
              </div>
              <h1 className="hero-main-title">{mainArticle.title}</h1>
              <p className="hero-main-summary">{mainArticle.summary}</p>
              <div className="hero-main-meta">
                <span>{mainArticle.author}</span>
                <span>·</span>
                <span>{mainArticle.readTime} min read</span>
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
                    {article.category}
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
