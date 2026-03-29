import { useState, useEffect } from 'react';
import { fetchArticles } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import HeroSection from '../../components/HeroSection/HeroSection';
import NewsFeed from '../../components/NewsFeed/NewsFeed';
import MarketWidget from '../../components/MarketWidget/MarketWidget';
import FeatureSlot from '../../components/FeatureSlot/FeatureSlot';
import './Home.css';

export default function Home() {
  const { language, t } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch articles whenever language changes (Hybrid Native Fetching)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchArticles(null, language)
      .then((data) => {
        if (cancelled) return;
        setArticles(data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Fetch error:', err);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [language]);

  if (loading) {
    return (
      <div className="home-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-lg)' }}>{t('loadingNews')}</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <HeroSection articles={articles} />

      <div className="home-content">
        <div className="home-main">
          <NewsFeed articles={articles} />
        </div>

        <div className="home-sidebar">
          <MarketWidget />

          <FeatureSlot
            featureId="my-et"
            icon="ET"
            title={t('personalizedNewsroom')}
            description={t('personalizedDesc')}
          />
        </div>
      </div>

      <div className="home-features">
        <div className="features-header">
          <h2>{t('aiFeatures')}</h2>
          <p>{t('featureSlots')}</p>
        </div>
        <div className="features-grid">
          <FeatureSlot
            featureId="news-navigator"
            icon="AI"
            title={t('newsNavigator')}
            description={t('featureSlots')}
          />
          <FeatureSlot
            featureId="video-studio"
            icon="▶"
            title="AI News Video Studio"
            description="Transform any article into a broadcast-quality 60–120 second video with AI narration and data visuals."
          />
          <FeatureSlot
            featureId="story-arc"
            icon="◈"
            title={t('storyArc')}
            description="Interactive timelines, key player maps, sentiment analysis, and 'what to watch next' predictions."
          />
          <FeatureSlot
            featureId="vernacular"
            icon="अ"
            title={t('vernacularEngine')}
            description="Culturally-adapted translation into Hindi, Tamil, Telugu — not just literal translation."
          />
        </div>
      </div>
    </div>
  );
}
