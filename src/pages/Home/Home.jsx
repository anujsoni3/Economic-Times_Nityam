import { useState, useEffect } from 'react';
import { fetchArticles } from '../../api';
import HeroSection from '../../components/HeroSection/HeroSection';
import NewsFeed from '../../components/NewsFeed/NewsFeed';
import MarketWidget from '../../components/MarketWidget/MarketWidget';
import FeatureSlot from '../../components/FeatureSlot/FeatureSlot';
import './Home.css';

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles()
      .then((data) => {
        setArticles(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="home-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-lg)' }}>Loading news...</p>
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

          {/* My ET — Personalized Newsroom placeholder */}
          <FeatureSlot
            featureId="my-et"
            icon="👤"
            title="My ET — Personalized Newsroom"
            description="Your personalized news feed tailored to your interests, portfolio, and professional role. This slot is ready for integration."
          />
        </div>
      </div>

      {/* All Feature Slots */}
      <div className="home-features">
        <div className="features-header">
          <h2>🤖 AI-Powered Features</h2>
          <p>Integration slots for each teammate's AI feature</p>
        </div>
        <div className="features-grid">
          <FeatureSlot
            featureId="news-navigator"
            icon="🧠"
            title="News Navigator — Interactive Briefings"
            description="AI-synthesized deep briefings from multiple articles on a single topic, with follow-up questions."
          />
          <FeatureSlot
            featureId="video-studio"
            icon="🎬"
            title="AI News Video Studio"
            description="Transform any article into a broadcast-quality 60–120 second video with AI narration and data visuals."
          />
          <FeatureSlot
            featureId="story-arc"
            icon="📊"
            title="Story Arc Tracker"
            description="Interactive timelines, key player maps, sentiment analysis, and 'what to watch next' predictions."
          />
          <FeatureSlot
            featureId="vernacular"
            icon="🌐"
            title="Vernacular Business News Engine"
            description="Culturally-adapted translation into Hindi, Tamil, Telugu, Bengali — not just literal translation."
          />
        </div>
      </div>
    </div>
  );
}
