import './WatchlistTemplate.css';

export default function WatchlistTemplate({ story }) {
  const watchlist = story.watchlist || [];

  return (
    <div className="wl-wrapper">

      {/* Cards */}
      <div className="wl-cards">
        {watchlist.map((item, idx) => (
          <div key={idx} className="wl-card">
            <div className="wl-card-icon">
              <i className="bi bi-binoculars"></i>
            </div>
            <div className="wl-card-content">
              <h4 className="wl-card-title">{item.event}</h4>
              <p className="wl-card-text">{item.detail}</p>
            </div>
            <div className="wl-card-number">#{idx + 1}</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="wl-stats">
        <div className="wl-stats-header">
          <h3 className="wl-stats-title">Story at a Glance</h3>
          <span className="wl-stats-count">{story.articles.length} articles</span>
        </div>
        <div className="wl-stats-grid">
          <div className="wl-stat">
            <div className="wl-stat-icon">
              <i className="bi bi-file-earmark-text"></i>
            </div>
            <div className="wl-stat-content">
              <span className="wl-stat-value">{story.articles.length}</span>
              <span className="wl-stat-label">Articles Tracked</span>
            </div>
          </div>
          <div className="wl-stat">
            <div className="wl-stat-icon">
              <i className="bi bi-graph-up-arrow"></i>
            </div>
            <div className="wl-stat-content">
              <span className="wl-stat-value">{story.articles.filter((a) => a.sentiment === 'positive').length}</span>
              <span className="wl-stat-label">Positive Articles</span>
            </div>
          </div>
          <div className="wl-stat">
            <div className="wl-stat-icon">
              <i className="bi bi-graph-down-arrow"></i>
            </div>
            <div className="wl-stat-content">
              <span className="wl-stat-value">{story.articles.filter((a) => a.sentiment === 'negative').length}</span>
              <span className="wl-stat-label">Negative Articles</span>
            </div>
          </div>
          <div className="wl-stat">
            <div className="wl-stat-icon">
              <i className="bi bi-people"></i>
            </div>
            <div className="wl-stat-content">
              <span className="wl-stat-value">{story.keyPlayers?.length || 0}</span>
              <span className="wl-stat-label">Key Players</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
