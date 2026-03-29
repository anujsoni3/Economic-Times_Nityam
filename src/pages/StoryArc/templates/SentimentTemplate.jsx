import './SentimentTemplate.css';

function formatDate(dateStr) {
  if (!dateStr) return '–';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const SCORE_MAP = { positive: 1, neutral: 0, negative: -1 };

const COLOR_MAP = {
  positive: { bar: '#16a34a', light: 'rgba(22,163,74,0.08)', text: '#16a34a', label: 'Positive', icon: 'bi-graph-up-arrow' },
  neutral:  { bar: '#8a8aa3', light: 'var(--bg-tertiary)',   text: '#4a4a68', label: 'Neutral',  icon: 'bi-dash-lg'        },
  negative: { bar: '#e03d3d', light: 'rgba(224,61,61,0.08)', text: '#e03d3d', label: 'Negative', icon: 'bi-graph-down-arrow' },
};

export default function SentimentTemplate({ story }) {
  const sorted = [...story.articles].sort((a, b) => new Date(a.publishedAt || 0) - new Date(b.publishedAt || 0));
  const counts = { positive: 0, neutral: 0, negative: 0 };
  sorted.forEach((a) => { counts[a.sentiment] = (counts[a.sentiment] || 0) + 1; });

  const total = sorted.length || 1;
  const overallScore = sorted.reduce((sum, a) => sum + (SCORE_MAP[a.sentiment] || 0), 0) / total;
  const overallLabel = overallScore > 0.2 ? 'Mostly Positive' : overallScore < -0.2 ? 'Mostly Negative' : 'Mixed / Neutral';
  const overallIcon = overallScore > 0.2 ? 'bi-graph-up-arrow' : overallScore < -0.2 ? 'bi-graph-down-arrow' : 'bi-dash-lg';
  const overallColor = overallScore > 0.2 ? 'var(--et-green)' : overallScore < -0.2 ? 'var(--et-red)' : 'var(--text-tertiary)';

  return (
    <div className="sent-wrapper">

      {/* ── Verdict ── */}
      <div className="sent-verdict">
        <div className="sent-verdict-emoji">
          <i className={`bi ${overallIcon}`} style={{ color: overallColor }}></i>
        </div>
        <div className="sent-verdict-text">
          <div className="sent-verdict-label" style={{ color: overallColor }}>{overallLabel}</div>
          <div className="sent-verdict-sub">Based on {total} article{total !== 1 ? 's' : ''} tracked</div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="sent-scorecards">
        {Object.entries(counts).map(([key, count]) => {
          const c = COLOR_MAP[key];
          const pct = Math.round((count / total) * 100);
          return (
            <div key={key} className="sent-scorecard" style={{ borderTopColor: c.bar }}>
              <div className="sent-scorecard-icon" style={{ color: c.bar }}>
                <i className={`bi ${c.icon}`}></i>
              </div>
              <div className="sent-scorecard-value" style={{ color: c.bar }}>{pct}%</div>
              <div className="sent-scorecard-label">{c.label}</div>
              <div className="sent-scorecard-count">{count} article{count !== 1 ? 's' : ''}</div>
            </div>
          );
        })}
      </div>

      {/* ── Track bar ── */}
      <div className="sent-track">
        <div className="sent-track-label">Sentiment Distribution</div>
        <div className="sent-track-bar">
          {Object.entries(counts).map(([key, count]) => {
            const c = COLOR_MAP[key];
            const pct = (count / total) * 100;
            return (
              <div key={key} className="sent-track-segment" style={{ width: `${pct}%`, background: c.bar }}></div>
            );
          })}
        </div>
        <div className="sent-track-legend">
          {Object.entries(counts).map(([key, count]) => {
            const c = COLOR_MAP[key];
            const pct = Math.round((count / total) * 100);
            return (
              <div key={key} className="sent-track-legend-item">
                <div className="sent-track-legend-dot" style={{ background: c.bar }}></div>
                <span>{c.label} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Article list ── */}
      <div className="sent-articles">
        <div className="sent-articles-header">
          <h3 className="sent-articles-title">Article Breakdown</h3>
          <span className="sent-articles-count">{total} article{total !== 1 ? 's' : ''}</span>
        </div>
        <div className="sent-articles-list">
          {[...sorted].reverse().map((article) => {
            const c = COLOR_MAP[article.sentiment];
            return (
              <div key={article.id} className="sent-article-item">
                <div className="sent-article-dot" style={{ background: c?.bar }}></div>
                <div className="sent-article-content">
                  {article.link
                    ? <a href={article.link} target="_blank" rel="noopener noreferrer" className="sent-article-title">{article.title}</a>
                    : <span className="sent-article-title">{article.title}</span>}
                  <div className="sent-article-meta">
                    <span className="sent-article-date"><i className="bi bi-calendar3"></i> {formatDate(article.publishedAt)}</span>
                    <span className="sent-article-sentiment" style={{ color: c?.text, background: c?.light }}>
                      <i className={`bi ${c?.icon}`}></i> {c?.label}
                    </span>
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
