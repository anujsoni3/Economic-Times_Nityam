import { useState } from 'react';
import './GlossaryTooltip.css';

export default function GlossaryTooltip({ text, glossary = [] }) {
  if (!glossary.length || !text) {
    return <p>{text}</p>;
  }

  // Split text into paragraphs and highlight glossary terms
  const paragraphs = text.split('\n\n').filter(Boolean);

  return (
    <div className="glossary-tooltip-text">
      {paragraphs.map((para, pIdx) => (
        <p key={pIdx}>
          <HighlightedText text={para} glossary={glossary} />
        </p>
      ))}
    </div>
  );
}

function HighlightedText({ text, glossary }) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Build a regex to find glossary translations in the text
  const terms = glossary
    .map((g) => g.translation)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length); // Match longest first

  if (!terms.length) return <>{text}</>;

  const escapedTerms = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const glossaryItem = glossary.find(
          (g) => g.translation && g.translation.toLowerCase() === part.toLowerCase()
        );

        if (glossaryItem) {
          return (
            <span
              key={i}
              className="glossary-highlight"
              onMouseEnter={() => setActiveTooltip(i)}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              {part}
              {activeTooltip === i && (
                <span className="glossary-popup">
                  <span className="glossary-popup-term">{glossaryItem.term}</span>
                  <span className="glossary-popup-arrow">→</span>
                  <span className="glossary-popup-translation">{glossaryItem.translation}</span>
                  <span className="glossary-popup-explanation">{glossaryItem.explanation}</span>
                </span>
              )}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
