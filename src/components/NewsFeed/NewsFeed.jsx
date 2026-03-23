import { useState } from 'react';
import ArticleCard from '../ArticleCard/ArticleCard';
import './NewsFeed.css';

const TABS = ['All', 'Markets', 'Industry', 'Tech', 'Economy', 'Wealth', 'Startups', 'Politics'];

export default function NewsFeed({ articles }) {
  const [activeTab, setActiveTab] = useState('All');

  const filtered = activeTab === 'All'
    ? articles
    : articles.filter((a) => a.category.toLowerCase() === activeTab.toLowerCase());

  return (
    <section className="news-feed">
      <div className="container">
        <h2 className="section-title">Latest News</h2>

        <div className="news-feed-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`feed-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
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
            No articles in this category yet.
          </p>
        )}
      </div>
    </section>
  );
}
