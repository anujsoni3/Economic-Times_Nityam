import './KeyPlayersTemplate.css';

const TAG_COLORS = {
  government: { bg: 'rgba(234,88,12,0.08)',  border: '#ea580c', text: '#ea580c', icon: 'bi-building',     label: 'Government' },
  regulator:  { bg: 'rgba(26,115,232,0.08)', border: '#1a73e8', text: '#1a73e8', icon: 'bi-shield-check', label: 'Regulator'  },
  industry:   { bg: 'rgba(22,163,74,0.08)',  border: '#16a34a', text: '#16a34a', icon: 'bi-briefcase',    label: 'Industry'   },
  default:    { bg: 'var(--bg-tertiary)',     border: '#8a8aa3', text: '#4a4a68', icon: 'bi-person',       label: 'Other'      },
};

function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function KeyPlayersTemplate({ story }) {
  const players = story.keyPlayers || [];
  const maxMentions = players[0]?.mentions || 1;

  return (
    <div className="kp-wrapper">

      {players.length === 0 ? (
        <div className="kp-empty">
          <div className="kp-empty-icon">
            <i className="bi bi-person-x"></i>
          </div>
          <h3 className="kp-empty-title">No Key Players Detected</h3>
          <p className="kp-empty-text">As more articles are tracked, prominent figures will appear here automatically.</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="kp-header">
            <div className="kp-header-content">
              <h3 className="kp-title">Key Players</h3>
              <p className="kp-subtitle">{players.length} figure{players.length !== 1 ? 's' : ''} detected across {story.articles.length} articles</p>
            </div>
            <div className="kp-legend">
              {Object.entries(TAG_COLORS).filter(([k]) => k !== 'default').map(([key, c]) => (
                <div key={key} className="kp-legend-item">
                  <div className="kp-legend-dot" style={{ background: c.border }}></div>
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="kp-grid">
            {players.map((player, idx) => {
              const c = TAG_COLORS[player.tag] || TAG_COLORS.default;
              const barPct = Math.round((player.mentions / maxMentions) * 100);
              return (
                <div key={player.name} className="kp-card">
                  <div className="kp-card-header">
                    <div className="kp-avatar" style={{ background: c.bg, color: c.text }}>
                      {getInitials(player.name)}
                    </div>
                    <div className="kp-rank">#{idx + 1}</div>
                  </div>
                  <div className="kp-card-body">
                    <h4 className="kp-name">{player.name}</h4>
                    <p className="kp-role">
                      <i className={`bi ${c.icon}`}></i> {player.role}
                    </p>
                    <div className="kp-mentions">
                      <div className="kp-mentions-bar">
                        <div className="kp-mentions-fill" style={{ width: `${barPct}%`, background: c.border }}></div>
                      </div>
                      <span className="kp-mentions-count" style={{ color: c.text }}>
                        {player.mentions} mention{player.mentions !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="kp-card-footer">
                    <span className="kp-tag" style={{ color: c.text, background: c.bg, borderColor: c.border }}>
                      {c.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

    </div>
  );
}
