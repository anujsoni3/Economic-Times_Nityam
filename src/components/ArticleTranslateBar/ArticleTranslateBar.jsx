import { useState } from 'react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../context/LanguageContext';
import { translateArticle } from '../../api';
import RegionalContext from '../RegionalContext/RegionalContext';
import GlossaryTooltip from '../GlossaryTooltip/GlossaryTooltip';
import './ArticleTranslateBar.css';

export default function ArticleTranslateBar({ article }) {
  const { t } = useLanguage();
  const [translatedData, setTranslatedData] = useState(null);
  const [activeLanguage, setActiveLanguage] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);
  const [showBilingual, setShowBilingual] = useState(false);

  const targetLanguages = SUPPORTED_LANGUAGES.filter((l) => l.code !== 'en');

  async function handleTranslate(langCode) {
    if (activeLanguage === langCode) {
      // Toggle back to English
      setActiveLanguage(null);
      setTranslatedData(null);
      setShowBilingual(false);
      return;
    }

    setIsTranslating(true);
    setError(null);
    setActiveLanguage(langCode);

    // Map code to full name for API
    const langMap = { hi: 'hindi', ta: 'tamil', te: 'telugu' };

    try {
      const result = await translateArticle(
        article.title,
        article.summary,
        article.content,
        langMap[langCode]
      );
      setTranslatedData(result);
    } catch (err) {
      setError(err.message || 'Translation failed');
      setActiveLanguage(null);
    } finally {
      setIsTranslating(false);
    }
  }

  return (
    <div className="article-translate-wrapper">
      {/* Floating Translate Bar */}
      <div className="translate-bar" id="article-translate-bar">
        <div className="translate-bar-label">
          <i className="bi bi-translate"></i>
          <span>{t('readIn')}</span>
        </div>
        <div className="translate-bar-buttons">
          {targetLanguages.map((lang) => (
            <button
              key={lang.code}
              className={`translate-lang-btn ${activeLanguage === lang.code ? 'active' : ''}`}
              onClick={() => handleTranslate(lang.code)}
              disabled={isTranslating}
              id={`translate-btn-${lang.code}`}
            >
              {lang.native}
            </button>
          ))}
        </div>

        {activeLanguage && !isTranslating && translatedData && (
          <div className="translate-bar-controls">
            <button
              className={`bilingual-toggle ${showBilingual ? 'active' : ''}`}
              onClick={() => setShowBilingual(!showBilingual)}
              title={t('bilingual')}
            >
              <i className="bi bi-layout-split"></i>
            </button>
            <span className="adapted-badge">
              <i className="bi bi-patch-check-fill"></i> {t('culturallyAdapted')}
            </span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isTranslating && (
        <div className="translate-loading">
          <div className="translate-shimmer"></div>
          <div className="translate-shimmer short"></div>
          <div className="translate-shimmer"></div>
          <p className="translate-loading-text">
            <i className="bi bi-stars"></i> {t('translating')}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="translate-error">
          <i className="bi bi-exclamation-triangle"></i> {error}
        </div>
      )}

      {/* Translated Content */}
      {translatedData && !isTranslating && (
        <div className={`translated-content ${showBilingual ? 'bilingual' : ''}`}>
          {showBilingual ? (
            <div className="bilingual-layout">
              <div className="bilingual-column original">
                <div className="bilingual-label">
                  <i className="bi bi-file-text"></i> {t('originalArticle')}
                </div>
                <h2 className="translated-title">{article.title}</h2>
                <div className="translated-body">
                  {article.content.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
              <div className="bilingual-divider"></div>
              <div className="bilingual-column translated">
                <div className="bilingual-label translated-label">
                  <i className="bi bi-translate"></i> {translatedData.language_native}
                </div>
                <h2 className="translated-title">{translatedData.translated_title}</h2>
                <div className="translated-body">
                  <GlossaryTooltip
                    text={translatedData.translated_content}
                    glossary={translatedData.glossary || []}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="single-translation">
              <h2 className="translated-title">{translatedData.translated_title}</h2>
              <p className="translated-summary">{translatedData.translated_summary}</p>
              <div className="translated-body">
                <GlossaryTooltip
                  text={translatedData.translated_content}
                  glossary={translatedData.glossary || []}
                />
              </div>

              {/* Regional Context Box */}
              {translatedData.regional_context && (
                <RegionalContext
                  context={translatedData.regional_context}
                  language={activeLanguage}
                  languageNative={translatedData.language_native}
                />
              )}

              {/* Glossary Section */}
              {translatedData.glossary && translatedData.glossary.length > 0 && (
                <div className="glossary-section">
                  <h3 className="glossary-title">
                    <i className="bi bi-book"></i> {t('glossary')}
                  </h3>
                  <div className="glossary-grid">
                    {translatedData.glossary.map((item, i) => (
                      <div key={i} className="glossary-card">
                        <div className="glossary-term-en">{item.term}</div>
                        <div className="glossary-term-native">{item.translation}</div>
                        <div className="glossary-explanation">{item.explanation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Back to English button */}
              <button
                className="back-to-english-btn"
                onClick={() => {
                  setActiveLanguage(null);
                  setTranslatedData(null);
                }}
              >
                <i className="bi bi-arrow-left"></i> {t('backToEnglish')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
