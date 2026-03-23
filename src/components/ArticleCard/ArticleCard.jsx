import { Link } from 'react-router-dom';
import './ArticleCard.css';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ArticleCard({ article, horizontal = false }) {
  return (
    <Link to={`/article/${article.id}`} className={`article-card ${horizontal ? 'horizontal' : ''}`}>
      <div className="article-card-image">
        <img
          src={article.imageUrl}
          alt={article.title}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="card-badges">
          <span className={`category-badge ${article.category.toLowerCase()}`}>
            {article.category}
          </span>
        </div>
      </div>

      <div className="article-card-body">
        <h3 className="article-card-title">{article.title}</h3>
        <p className="article-card-summary">{article.summary}</p>
        <div className="article-card-meta">
          <span className="article-card-author">{article.author}</span>
          <span className="article-card-time">
            🕐 {article.readTime} min · {timeAgo(article.publishedAt)}
          </span>
        </div>
      </div>

      <div className="article-card-actions">
        {/* Story Arc Tracker placeholder */}
        <button className="card-action-btn" onClick={(e) => e.preventDefault()} title="Story Arc Tracker — integration slot">
          📊 Track Story
        </button>
        {/* News Navigator placeholder */}
        <button className="card-action-btn" onClick={(e) => e.preventDefault()} title="News Navigator — integration slot">
          🧠 AI Briefing
        </button>
      </div>
    </Link>
  );
}
