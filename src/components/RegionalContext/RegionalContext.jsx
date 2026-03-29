import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './RegionalContext.css';

const LANG_THEMES = {
  hi: { gradient: 'linear-gradient(135deg, #fff7ed, #fff1e6)', border: '#fb923c', icon: '🏛️', region: 'हिंदी बेल्ट' },
  ta: { gradient: 'linear-gradient(135deg, #fef2f2, #ffe4e6)', border: '#f43f5e', icon: '🛕', region: 'தமிழ்நாடு' },
  te: { gradient: 'linear-gradient(135deg, #fefce8, #fef9c3)', border: '#eab308', icon: '🕌', region: 'తెలుగు రాష్ట్రాలు' },
};

export default function RegionalContext({ context, language, languageNative }) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);
  const theme = LANG_THEMES[language] || LANG_THEMES.hi;

  return (
    <div
      className="regional-context"
      style={{
        background: theme.gradient,
        borderColor: theme.border,
      }}
      id="regional-context-box"
    >
      <button
        className="regional-context-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="regional-context-title">
          <span className="regional-icon">{theme.icon}</span>
          <span>{t('regionalImpact')} — {theme.region}</span>
        </div>
        <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} regional-toggle`}></i>
      </button>

      {isExpanded && (
        <div className="regional-context-body">
          <p>{context}</p>
          <div className="regional-badge">
            <i className="bi bi-geo-alt-fill"></i>
            {languageNative} · AI-Generated Local Context
          </div>
        </div>
      )}
    </div>
  );
}
