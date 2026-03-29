import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchArticles } from '../../api';
import TimelineTemplate from './templates/TimelineTemplate';
import SentimentTemplate from './templates/SentimentTemplate';
import KeyPlayersTemplate from './templates/KeyPlayersTemplate';
import WatchlistTemplate from './templates/WatchlistTemplate';
import './StoryArc.css';

function groupArticlesIntoStories(articles) {
  const stories = {};
  const STORY_KEYWORDS = [
    { keywords: ['rbi', 'repo rate', 'monetary policy', 'reserve bank'], key: 'rbi-rate-decision', name: 'RBI Rate Decisions' },
    { keywords: ['adani', 'hindenburg'], key: 'adani-hindenburg', name: 'Adani-Hindenburg Saga' },
    { keywords: ['tata', 'apple', 'iphone'], key: 'tata-apple-iphone', name: 'Tata–Apple iPhone Deal' },
    { keywords: ['reliance', 'jio', 'telecom'], key: 'reliance-jio', name: 'Reliance Jio Expansion' },
    { keywords: ['budget', 'union budget', 'finance minister'], key: 'union-budget', name: 'Union Budget 2025' },
    { keywords: ['startup', 'funding', 'unicorn', 'series'], key: 'startup-funding', name: 'Startup Funding Wave' },
    { keywords: ['rupee', 'dollar', 'forex', 'usd inr'], key: 'rupee-dollar', name: 'Rupee vs Dollar' },
    { keywords: ['ipo', 'listing', 'sebi', 'stock'], key: 'ipo-wave', name: 'IPO & Listing Frenzy' },
    { keywords: ['inflation', 'cpi', 'wpi', 'price rise'], key: 'inflation-watch', name: 'Inflation Watch' },
    { keywords: ['it', 'infosys', 'wipro', 'tcs', 'tech layoff'], key: 'it-sector', name: 'IT Sector Outlook' },
  ];

  articles.forEach((article) => {
    const titleLower = article.title.toLowerCase();
    let storyKey = null;
    let storyName = null;

    for (const mapping of STORY_KEYWORDS) {
      if (mapping.keywords.some((kw) => titleLower.includes(kw))) {
        storyKey = mapping.key;
        storyName = mapping.name;
        break;
      }
    }

    if (!storyKey) {
      storyKey = article.category?.toLowerCase().replace(/\s+/g, '-') || 'general';
      storyName = article.category || 'General';
    }

    if (!stories[storyKey]) {
      stories[storyKey] = { slug: storyKey, name: storyName, category: article.category, articles: [] };
    }
    stories[storyKey].articles.push(article);
  });

  return stories;
}

function scoreSentiment(text) {
  const positive = ['growth', 'surge', 'gains', 'rally', 'profit', 'record', 'boost', 'rise', 'up', 'strong', 'bullish', 'expansion', 'recovery'];
  const negative = ['fall', 'drop', 'crash', 'loss', 'decline', 'down', 'weak', 'crisis', 'deficit', 'bearish', 'concern', 'slump', 'trouble'];
  const lower = text.toLowerCase();
  let score = 0;
  positive.forEach((w) => { if (lower.includes(w)) score += 1; });
  negative.forEach((w) => { if (lower.includes(w)) score -= 1; });
  if (score > 1) return 'positive';
  if (score < -1) return 'negative';
  return 'neutral';
}

function extractKeyPlayers(articles) {
  const KNOWN_PLAYERS = [
    { name: 'Narendra Modi', role: 'Prime Minister', tag: 'government' },
    { name: 'Nirmala Sitharaman', role: 'Finance Minister', tag: 'government' },
    { name: 'Shaktikanta Das', role: 'RBI Governor', tag: 'regulator' },
    { name: 'Mukesh Ambani', role: 'Chairman, Reliance', tag: 'industry' },
    { name: 'Gautam Adani', role: 'Chairman, Adani Group', tag: 'industry' },
    { name: 'N Chandrasekaran', role: 'Chairman, Tata Sons', tag: 'industry' },
    { name: 'Salil Parekh', role: 'CEO, Infosys', tag: 'industry' },
    { name: 'SEBI', role: 'Market Regulator', tag: 'regulator' },
    { name: 'RBI', role: 'Central Bank', tag: 'regulator' },
    { name: 'CCI', role: 'Competition Authority', tag: 'regulator' },
  ];

  const fullText = articles.map((a) => a.title + ' ' + (a.summary || '')).join(' ');
  const found = [];
  KNOWN_PLAYERS.forEach((player) => {
    if (fullText.toLowerCase().includes(player.name.toLowerCase())) {
      const mentions = (fullText.toLowerCase().match(new RegExp(player.name.toLowerCase(), 'g')) || []).length;
      found.push({ ...player, mentions });
    }
  });
  return found.sort((a, b) => b.mentions - a.mentions).slice(0, 6);
}

function generateWatchlist(story) {
  const WATCHLIST_TEMPLATES = {
    'rbi-rate-decision': [
      { event: 'Next MPC Meeting', detail: 'Watch for stance change from "withdrawal of accommodation"' },
      { event: 'Inflation Data (CPI)', detail: 'If CPI stays above 5%, rate cuts remain unlikely' },
      { event: 'US Fed Signals', detail: 'Global rate environment heavily influences RBI decisions' },
      { event: 'GDP Growth Print', detail: 'Strong growth gives RBI room to hold or cut' },
    ],
    'adani-hindenburg': [
      { event: 'SEBI Investigation Outcome', detail: 'Market regulator probe conclusion will be pivotal' },
      { event: 'FPO Subscription Data', detail: 'Investor confidence indicator after controversy' },
      { event: 'Court Hearings', detail: 'SC-appointed panel findings could reshape narrative' },
      { event: 'Credit Ratings', detail: "Any downgrade from Moody's/S&P would be critical" },
    ],
    'union-budget': [
      { event: 'Tax Collection Data', detail: 'Determines fiscal headroom for spending' },
      { event: 'Implementation Notifications', detail: 'Ministry circulars converting announcements to policy' },
      { event: 'GST Council Meetings', detail: 'Rate rationalisations following budget direction' },
      { event: 'State Budget Alignment', detail: 'How states complement or diverge from Centre' },
    ],
    'startup-funding': [
      { event: 'RBI FEMA Approvals', detail: 'Foreign funding clearances for large rounds' },
      { event: 'Q1 Funding Reports', detail: 'Tracker data from Tracxn / Inc42 quarterly review' },
      { event: 'SEBI SME IPO Window', detail: 'Alternative exit route for smaller startups' },
      { event: 'AI Startup Valuations', detail: 'Whether premium multiples sustain or compress' },
    ],
  };

  return WATCHLIST_TEMPLATES[story.slug] || [
    { event: 'Policy Announcements', detail: 'Government or regulatory decisions on this topic' },
    { event: 'Quarterly Earnings', detail: 'Financial results from key companies involved' },
    { event: 'Industry Body Statements', detail: 'Chambers of Commerce & sector associations' },
    { event: 'International Developments', detail: 'Global events that could impact this story' },
  ];
}

const TEMPLATES = [
  { id: 'timeline', label: 'Timeline',    icon: 'bi-clock-history'    },
  { id: 'sentiment', label: 'Sentiment',  icon: 'bi-activity'         },
  { id: 'players', label: 'Key Players',  icon: 'bi-people'           },
  { id: 'watchlist', label: 'Watch Next', icon: 'bi-binoculars'       },
];

export default function StoryArc() {
  const { slug } = useParams();
  const [stories, setStories] = useState({});
  const [activeStory, setActiveStory] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState('timeline');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles()
      .then((data) => {
        const grouped = groupArticlesIntoStories(data);
        setStories(grouped);
        const target = slug && grouped[slug] ? grouped[slug] : Object.values(grouped)[0];
        if (target) setActiveStory(enrichStory(target));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  function enrichStory(story) {
    const articles = story.articles.map((a) => ({
      ...a,
      sentiment: scoreSentiment(a.title + ' ' + (a.summary || '')),
    }));
    return { ...story, articles, keyPlayers: extractKeyPlayers(articles), watchlist: generateWatchlist(story) };
  }

  function selectStory(s) {
    setActiveStory(enrichStory(s));
    setActiveTemplate('timeline');
  }

  if (loading) {
    return (
      <div className="sa-loading">
        <div className="sa-loading-spinner" />
        <p>Tracking story arcs…</p>
      </div>
    );
  }

  const storyList = Object.values(stories).filter((s) => s.articles.length >= 2);

  return (
    <div className="sa-page">
      <aside className="sa-sidebar">
        <div className="sa-sidebar-header">
          <h2><i className="bi bi-diagram-3"></i> Story Arc Tracker</h2>
          <p>Follow ongoing business stories</p>
        </div>
        <div className="sa-story-list">
          {storyList.map((story) => (
            <button
              key={story.slug}
              className={`sa-story-item ${activeStory?.slug === story.slug ? 'active' : ''}`}
              onClick={() => selectStory(story)}
            >
              <span className="sa-story-name">{story.name}</span>
              <span className="sa-story-count">{story.articles.length} articles</span>
            </button>
          ))}
          {storyList.length === 0 && (
            <p className="sa-empty">No ongoing stories detected yet. Check back as more articles are loaded.</p>
          )}
        </div>
      </aside>

      <main className="sa-main">
        {activeStory ? (
          <>
            <div className="sa-story-header">
              <div>
                <span className="sa-category-badge">{activeStory.category}</span>
                <h1 className="sa-story-title">{activeStory.name}</h1>
                <p className="sa-story-meta">{activeStory.articles.length} articles tracked</p>
              </div>
            </div>

            <div className="sa-tabs">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  className={`sa-tab ${activeTemplate === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTemplate(t.id)}
                >
                  <i className={`bi ${t.icon}`}></i> {t.label}
                </button>
              ))}
            </div>

            <div className="sa-template-area">
              {activeTemplate === 'timeline' && <TimelineTemplate story={activeStory} />}
              {activeTemplate === 'sentiment' && <SentimentTemplate story={activeStory} />}
              {activeTemplate === 'players' && <KeyPlayersTemplate story={activeStory} />}
              {activeTemplate === 'watchlist' && <WatchlistTemplate story={activeStory} />}
            </div>
          </>
        ) : (
          <div className="sa-no-story">
            <div className="sa-no-story-icon"><i className="bi bi-newspaper"></i></div>
            <h2>Select a Story</h2>
            <p>Pick an ongoing story from the sidebar to track its arc.</p>
          </div>
        )}
      </main>
    </div>
  );
}
