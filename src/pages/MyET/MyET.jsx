import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { streamMyET } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import './MyET.css';

const SUGGESTED_INTERESTS = [
  'AI chips and data centers',
  'EV batteries and charging',
  'RBI rate cuts and inflation',
  'Startup funding and IPOs',
  'Semiconductors and supply chain',
];

export default function MyET() {
  const { language, t } = useLanguage();

  const [interests, setInterests] = useState('AI, EV batteries, RBI rate cuts');
  const [agentLogs, setAgentLogs] = useState([]);
  const [feed, setFeed] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState('');

  const streamCleanupRef = useRef(null);
  const terminalBodyRef = useRef(null);

  const titleText = useMemo(() => t('personalizedNewsroom'), [t]);

  useEffect(() => {
    if (!terminalBodyRef.current) return;
    terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
  }, [agentLogs]);

  useEffect(() => {
    return () => {
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
      }
    };
  }, []);

  const stopCurrentStream = () => {
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
      streamCleanupRef.current = null;
    }
  };

  const addLog = (line) => {
    setAgentLogs((prev) => [...prev, line]);
  };

  const startPersonalization = () => {
    const query = interests.trim();
    if (!query) return;

    stopCurrentStream();

    setHasRun(false);
    setError('');
    setFeed([]);
    setAgentLogs([]);
    setShowTerminal(true);
    setIsGenerating(true);

    addLog(`[User Profile] Interests captured: "${query}"`);

    streamCleanupRef.current = streamMyET({
      interests: query,
      language,
      onStatus: (msg) => {
        addLog(msg);
      },
      onComplete: (articles) => {
        setFeed(articles);
        setHasRun(true);
        setIsGenerating(false);
        addLog(`[System] Personalization completed with ${articles.length} stories.`);
        window.setTimeout(() => setShowTerminal(false), 700);
      },
      onError: (message) => {
        const msg = message || 'My ET pipeline failed unexpectedly.';
        setError(msg);
        setHasRun(true);
        setIsGenerating(false);
        addLog(`[Error] ${msg}`);
      },
    });
  };

  return (
    <div className="myet-page">
      <div className="myet-ambient" aria-hidden="true" />

      <section className="myet-hero">
        <p className="myet-kicker">Autonomous Multi-Agent Personalization</p>
        <h1>{titleText}</h1>
        <p className="myet-subtitle">{t('personalizedDesc')}</p>

        <div className="myet-interest-panel">
          <label className="myet-label" htmlFor="myet-interest-input">
            Enter your interests
          </label>
          <div className="myet-input-row">
            <input
              id="myet-interest-input"
              className="myet-interest-input"
              value={interests}
              onChange={(event) => setInterests(event.target.value)}
              placeholder="AI, EV batteries, RBI rate cuts"
              disabled={isGenerating}
            />
            <button
              className="myet-generate-btn"
              onClick={startPersonalization}
              disabled={isGenerating || !interests.trim()}
              type="button"
            >
              {isGenerating ? 'Generating...' : 'Generate My ET'}
            </button>
          </div>

          <div className="myet-chip-row">
            {SUGGESTED_INTERESTS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="myet-chip"
                onClick={() => setInterests(chip)}
                disabled={isGenerating}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error ? <p className="myet-error">{error}</p> : null}

      {showTerminal ? (
        <section className="myet-terminal-wrap myet-terminal-wrap--visible">
          <div className="myet-terminal">
            <div className="myet-terminal-head">
              <div className="myet-terminal-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p>LangGraph Agent Console</p>
              <div className="myet-live-pill">
                <span />
                LIVE
              </div>
            </div>
            <div className="myet-terminal-body" ref={terminalBodyRef}>
              {agentLogs.map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {!showTerminal && hasRun ? (
        <section className="myet-feed-section">
          <div className="myet-feed-header">
            <h2>Personalized Feed</h2>
            <p>{feed.length} stories aligned to your profile</p>
          </div>

          {feed.length === 0 ? (
            <div className="myet-empty">
              <h3>No strong matches found this cycle.</h3>
              <p>Try broader interests or switch your language for a different regional article set.</p>
            </div>
          ) : (
            <div className="myet-grid">
              {feed.map((article) => (
                <article className="myet-card" key={article.id}>
                  <div className="myet-card-top">
                    <span className="myet-category">{article.category || 'Top Stories'}</span>
                    <span className="myet-time">{article.readTime || 2} {t('minRead')}</span>
                  </div>

                  <h3>{article.title}</h3>
                  <p className="myet-summary">{article.summary}</p>

                  <p className="myet-match-reason">
                    <strong>Match Reason:</strong> {article.match_reason || 'Aligned to your selected interests.'}
                  </p>

                  <div className="myet-card-actions">
                    <Link to={`/article/${article.id}`} className="myet-action myet-action--primary">
                      Open Story
                    </Link>
                    {article.link ? (
                      <a
                        className="myet-action"
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Source
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
