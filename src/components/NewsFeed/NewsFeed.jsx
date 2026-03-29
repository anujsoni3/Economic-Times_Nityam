import { useState } from 'react';
import ArticleCard from '../ArticleCard/ArticleCard';
import { useLanguage } from '../../context/LanguageContext';
import './NewsFeed.css';

const TABS = ['All', 'Markets', 'Industry', 'Tech', 'Economy', 'Wealth', 'Startups', 'Politics'];

const CATEGORY_TRANSLATIONS = {
  hi: { 'All': 'सभी', 'Markets': 'बाज़ार', 'Industry': 'उद्योग', 'Tech': 'टेक', 'Wealth': 'सम्पत्ति', 'Economy': 'अर्थव्यवस्था', 'Politics': 'राजनीति', 'Startups': 'स्टार्टअप' },
  ta: { 'All': 'அனைத்தும்', 'Markets': 'சந்தைகள்', 'Industry': 'தொழில்', 'Tech': 'தொழில்நுட்பம்', 'Wealth': 'செல்வம்', 'Economy': 'பொருளாதாரம்', 'Politics': 'அரசியல்', 'Startups': 'ஸ்டார்ட்அப்' },
  te: { 'All': 'అన్ని', 'Markets': 'మార్కెట్లు', 'Industry': 'పరిశ్రమ', 'Tech': 'టెక్', 'Wealth': 'సంపద', 'Economy': 'ఆర్థిక వ్యవస్థ', 'Politics': 'రాజకీయాలు', 'Startups': 'స్టార్టప్‌లు' },
};

export default function NewsFeed({ articles }) {
  const [activeTab, setActiveTab] = useState('All');
  const { language, t } = useLanguage();

  const filtered = activeTab === 'All'
    ? articles
    : articles.filter((a) => a.category.toLowerCase() === activeTab.toLowerCase());

  const getTabLabel = (tab) => {
    if (language !== 'en' && CATEGORY_TRANSLATIONS[language]) {
      return CATEGORY_TRANSLATIONS[language][tab] || tab;
    }
    return tab;
  };

  return (
    <section className="news-feed">
      <div className="container">
        <h2 className="section-title">{t('latestNews')}</h2>

        <div className="news-feed-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`feed-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {getTabLabel(tab)}
            </button>
          ))}
        </div>

        <div className="news-feed-grid">
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 'var(--sp-8)' }}>
            {t('noArticles')}
          </p>
        )}
      </div>
    </section>
  );
}
