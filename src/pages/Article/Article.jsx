import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchArticle, fetchArticles } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import MarketWidget from '../../components/MarketWidget/MarketWidget';
import FeatureSlot from '../../components/FeatureSlot/FeatureSlot';
import ArticleTranslateBar from '../../components/ArticleTranslateBar/ArticleTranslateBar';
import './Article.css';

export default function Article() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchArticle(parseInt(id)), fetchArticles(null, language)])
      .then(([art, all]) => {
        setArticle(art);
        setRelated(all.filter((a) => a.id !== art.id && a.category === art.category).slice(0, 5));
        setLoading(false);
        window.scrollTo(0, 0);
      })
      .catch(() => setLoading(false));
  }, [id, language]);

  if (loading || !article) {
    return (
      <div className="article-page container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-tertiary)' }}>{t('loadingArticle')}</p>
      </div>
    );
  }

  return (
    <div className="article-page">
      <div className="container">
        <div className="article-layout">
          <div className="article-content">
            <div className="article-header">
              <div className="article-category-badge">
                <span className={`category-badge ${article.category.toLowerCase()}`}>
                  {article.category}
                </span>
              </div>
              <h1 className="article-title">{article.title}</h1>
              <div className="article-meta">
                <span className="article-meta-author">{article.author}</span>
                <span>·</span>
                <span>{article.readTime} {t('minRead')}</span>
                <span>·</span>
                <span>{new Date(article.publishedAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}</span>
              </div>
            </div>

            {/* 🌍 Vernacular Engine — Translate Bar */}
            {(article.source_lang === 'en' || !article.source_lang) && <ArticleTranslateBar article={article} />}

            <img
              className="article-hero-image"
              src={article.imageUrl}
              alt={article.title}
              onError={(e) => { e.target.style.display = 'none'; }}
            />

            <div className="article-body">
              {article.content.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {article.tags && (
              <div className="article-tags">
                {article.tags.map((tag) => (
                  <span key={tag} className="article-tag">#{tag}</span>
                ))}
              </div>
            )}

            {/* Feature integration slots on article page */}
            <div className="article-feature-slots">
              <FeatureSlot
                featureId="story-arc-article"
                icon="📊"
                title="Story Arc Tracker"
                description="Track this story's evolution: timeline, key players, sentiment shifts, and predictions."
                to="/story-arc"
              />
            </div>
          </div>

          <div className="article-sidebar">
            <MarketWidget />

            {related.length > 0 && (
              <div className="related-articles">
                <h3>{t('relatedStories')}</h3>
                {related.map((r) => (
                  <Link key={r.id} to={`/article/${r.id}`} className="related-article-item">
                    <h4>{r.title}</h4>
                    <span className="related-meta">{r.readTime} {t('minRead')}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
