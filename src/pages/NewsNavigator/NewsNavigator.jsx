// src/pages/NewsNavigator/NewsNavigator.jsx
// New page — does NOT modify any existing page or component

import { useState, useRef, useEffect } from "react";
import { generateBriefing, askQuestion } from "../../api";
import { useLanguage } from "../../context/LanguageContext";
import "./NewsNavigator.css";

// ─── Briefing Section Card ───────────────────────────────────
function BriefingCard({ icon, label, content }) {
  return (
    <div className="nn-card">
      <div className="nn-card-header">
        <span className="nn-card-icon">{icon}</span>
        <h3 className="nn-card-label">{label}</h3>
      </div>
      <p className="nn-card-content">{content}</p>
    </div>
  );
}

// ─── Source Chip ─────────────────────────────────────────────
function SourceChip({ title, link }) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="nn-source-chip"
      title={title}
    >
      <span className="nn-source-dot" />
      <span className="nn-source-title">{title}</span>
      <span className="nn-source-arrow">↗</span>
    </a>
  );
}

// ─── Q&A Message ─────────────────────────────────────────────
function QAMessage({ question, answer, citations }) {
  return (
    <div className="nn-qa-block">
      <div className="nn-qa-q">
        <span className="nn-qa-label">Q</span>
        <p>{question}</p>
      </div>
      <div className="nn-qa-a">
        <span className="nn-qa-label nn-qa-label--a">A</span>
        <div>
          <p>{answer}</p>
          {citations && citations.length > 0 && (
            <div className="nn-qa-citations">
              {citations.map((c, i) => (
                <a
                  key={i}
                  href={c.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nn-citation-link"
                >
                  [{i + 1}] {c.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function NewsNavigator() {
  const { language } = useLanguage();
  const [topic, setTopic] = useState("");
  const [briefingData, setBriefingData] = useState(null); // { briefing, sources }
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [briefingError, setBriefingError] = useState("");

  const [question, setQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState([]); // [{ question, answer, citations }]
  const [loadingQA, setLoadingQA] = useState(false);
  const [qaError, setQaError] = useState("");

  const qaEndRef = useRef(null);

  // Auto-scroll Q&A to bottom
  useEffect(() => {
    if (qaHistory.length > 0) {
      qaEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [qaHistory]);

  // ── Generate Briefing ──────────────────────────────────────
  async function handleGenerate(e) {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoadingBriefing(true);
    setBriefingError("");
    setBriefingData(null);
    setQaHistory([]);

    try {
      const data = await generateBriefing(topic.trim(), language);
      setBriefingData(data);
    } catch (err) {
      setBriefingError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoadingBriefing(false);
    }
  }

  // ── Ask Follow-up Question ─────────────────────────────────
  async function handleAsk(e) {
    e.preventDefault();
    if (!question.trim() || !briefingData) return;

    const q = question.trim();
    setQuestion("");
    setLoadingQA(true);
    setQaError("");

    try {
      const result = await askQuestion(
        q,
        briefingData.briefing,
        briefingData.sources,
        briefingData.matched_articles || []
      );
      setQaHistory((prev) => [
        ...prev,
        { question: q, answer: result.answer, citations: result.citations || [] },
      ]);
    } catch (err) {
      setQaError(err.message || "Could not get an answer. Try again.");
    } finally {
      setLoadingQA(false);
    }
  }

  const hasBriefing = briefingData && briefingData.briefing;

  return (
    <div className="nn-root">
      {/* ── Header ── */}
      <div className="nn-header">
        <div className="nn-header-badge">AI-Powered</div>
        <h1 className="nn-title">News Navigator</h1>
        <p className="nn-subtitle">
          Enter any topic — get one structured AI briefing, then ask follow-up
          questions answered strictly from that briefing.
        </p>
      </div>

      {/* ── Topic Input ── */}
      <form className="nn-search-form" onSubmit={handleGenerate}>
        <div className="nn-search-bar">
          <span className="nn-search-icon">◎</span>
          <input
            type="text"
            className="nn-search-input"
            placeholder="e.g. RBI Rate Cut, Budget 2025, Sensex Rally…"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loadingBriefing}
            aria-label="Topic input"
          />
          <button
            type="submit"
            className="nn-search-btn"
            disabled={loadingBriefing || !topic.trim()}
          >
            {loadingBriefing ? (
              <span className="nn-spinner" aria-label="Loading" />
            ) : (
              "Generate Briefing"
            )}
          </button>
        </div>
        {briefingError && (
          <p className="nn-error" role="alert">
            ⚠ {briefingError}
          </p>
        )}
      </form>

      {/* ── Loading State ── */}
      {loadingBriefing && (
        <div className="nn-loading-block">
          <div className="nn-pulse-row">
            <div className="nn-pulse" style={{ width: "60%" }} />
            <div className="nn-pulse" style={{ width: "40%" }} />
            <div className="nn-pulse" style={{ width: "80%" }} />
            <div className="nn-pulse" style={{ width: "55%" }} />
          </div>
          <p className="nn-loading-label">Fetching articles & generating briefing…</p>
        </div>
      )}

      {/* ── Briefing ── */}
      {hasBriefing && (
        <div className="nn-briefing-section">
          <div className="nn-briefing-meta">
            <span className="nn-topic-tag">#{briefingData.topic || topic}</span>
            <span className="nn-source-count">
              {briefingData.sources.length} sources analysed
            </span>
          </div>

          <div className="nn-cards-grid">
            <BriefingCard
              icon="📌"
              label="What Happened"
              content={briefingData.briefing.what_happened}
            />
            <BriefingCard
              icon="👥"
              label="Key Players"
              content={briefingData.briefing.key_players}
            />
            <BriefingCard
              icon="📊"
              label="Impact"
              content={briefingData.briefing.impact}
            />
            <BriefingCard
              icon="🔭"
              label="What's Next"
              content={briefingData.briefing.whats_next}
            />
          </div>

          {/* Sources */}
          <div className="nn-sources-section">
            <h4 className="nn-sources-heading">Sources</h4>
            <div className="nn-sources-list">
              {briefingData.sources.map((s, i) => (
                <SourceChip key={i} title={s.title} link={s.link} />
              ))}
            </div>
          </div>

          {/* ── Q&A ── */}
          <div className="nn-qa-section">
            <h4 className="nn-qa-heading">
              <span className="nn-qa-heading-icon">💬</span>
              Ask a follow-up question
            </h4>
            <p className="nn-qa-rule">
              Answers are drawn strictly from the briefing above.
            </p>

            {qaHistory.length > 0 && (
              <div className="nn-qa-history">
                {qaHistory.map((item, i) => (
                  <QAMessage
                    key={i}
                    question={item.question}
                    answer={item.answer}
                    citations={item.citations}
                  />
                ))}
                <div ref={qaEndRef} />
              </div>
            )}

            {qaError && (
              <p className="nn-error" role="alert">
                ⚠ {qaError}
              </p>
            )}

            <form className="nn-qa-form" onSubmit={handleAsk}>
              <input
                type="text"
                className="nn-qa-input"
                placeholder="Ask anything about this briefing…"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={loadingQA}
                aria-label="Follow-up question"
              />
              <button
                type="submit"
                className="nn-qa-btn"
                disabled={loadingQA || !question.trim()}
              >
                {loadingQA ? <span className="nn-spinner nn-spinner--sm" /> : "Ask"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {!loadingBriefing && !hasBriefing && !briefingError && (
        <div className="nn-empty-state">
          <div className="nn-empty-icon">◎</div>
          <p>Enter a topic above to generate your briefing</p>
          <div className="nn-suggested-topics">
            {["RBI Rate Cut", "Budget 2025", "Nifty Rally", "SEBI Regulations"].map(
              (t) => (
                <button
                  key={t}
                  className="nn-suggestion-chip"
                  onClick={() => setTopic(t)}
                >
                  {t}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}