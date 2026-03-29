import './TimelineTemplate.css';

function formatDate(dateStr) {
  if (!dateStr) return { day: 'Recently', time: '' };
  const d = new Date(dateStr);
  if (isNaN(d)) return { day: dateStr, time: '' };
  return {
    day: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

const SENTIMENT_COLORS = {
  positive: { bg: 'rgba(22,163,74,0.07)',  border: '#16a34a', dot: '#16a34a', text: '#16a34a', label: 'Positive' },
  negative: { bg: 'rgba(224,61,61,0.07)', border: '#e03d3d', dot: '#e03d3d', text: '#e03d3d', label: 'Negative' },
  neutral:  { bg: 'var(--bg-secondary)',   border: '#8a8aa3', dot: '#8a8aa3', text: '#4a4a68', label: 'Neutral'  },
};

export default function TimelineTemplate({ story }) {
  const sorted = [...story.articles].sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

  return (
    <div className="tl-wrapper">
      <div className="sa-card">
        {/* Header row with legend */}
        <div className="tl-card-title-row">
          <span className="sa-card-title">Story Timeline</span>
          <div className="tl-legend">
            {Object.entries(SENTIMENT_COLORS).map(([key, cfg]) => (
              <span key={key} className="tl-legend-item">
                <span className="tl-legend-dot" style={{ background: cfg.dot }} />
                {cfg.label}
              </span>
            ))}
          </div>
        </div>

        <p className="tl-subtitle">{sorted.length} articles · most recent first</p>

        <div className="tl-timeline">
          {sorted.map((article, idx) => {
            const colors = SENTIMENT_COLORS[article.sentiment] || SENTIMENT_COLORS.neutral;
            const isFirst = idx === 0;
            const { day, time } = formatDate(article.publishedAt);

            return (
              <div key={article.id} className="tl-entry">
                {/* Date */}
                <div className="tl-date-col">
                  <span className="tl-date-day">{day}</span>
                  {time && <span className="tl-date-time">{time}</span>}
                </div>

                {/* Dot + line */}
                <div className="tl-line-col">
                  <div
                    className="tl-dot"
                    style={{ background: colors.dot, color: colors.dot }}
                  />
                  {idx < sorted.length - 1 && <div className="tl-connector" />}
                </div>

                {/* Card */}
                <div
                  className={`tl-card ${isFirst ? 'tl-card--latest' : ''}`}
                  style={{ borderLeftColor: colors.border, background: colors.bg }}
                >
                  <div className="tl-card-content">
                    <div className="tl-card-text">
                      <div className="tl-card-top">
                        {isFirst && <span className="tl-latest-badge">Latest</span>}
                        <span className="tl-sentiment" style={{ color: colors.text, background: `${colors.dot}18` }}>
                          {colors.label}
                        </span>
                        <span className="tl-category-tag">{article.category}</span>
                      </div>

                      <h4 className="tl-title">
                        {article.link
                          ? <a href={article.link} target="_blank" rel="noopener noreferrer">{article.title}</a>
                          : article.title}
                      </h4>

                      {article.summary && (
                        <p className="tl-summary">{article.summary.slice(0, 160)}…</p>
                      )}

                      <div className="tl-meta">
                        <span><i className="bi bi-pencil-fill me-1"></i>{article.author || 'ET Bureau'}</span>
                        <span><i className="bi bi-clock me-1"></i>{article.readTime || 2} min read</span>
                      </div>
                    </div>

                    {article.imageUrl && (
                      <div className="tl-card-image">
                        <img src={article.imageUrl} alt={article.title} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
