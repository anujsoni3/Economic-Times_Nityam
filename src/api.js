const API_BASE = 'http://localhost:8000';

export async function fetchArticles(category = null, language = "en") {
  const url = new URL(`${API_BASE}/api/articles`);
  if (category) url.searchParams.append("category", category);
  if (language) url.searchParams.append("lang", language);
  const res = await fetch(url.toString());
  return res.json();
}

export async function fetchArticle(id) {
  const res = await fetch(`${API_BASE}/api/articles/${id}`);
  return res.json();
}

export async function fetchMarketData() {
  const res = await fetch(`${API_BASE}/api/market-data`);
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/api/categories`);
  return res.json();
}

export async function fetchStoryArcs() {
  const res = await fetch(`${API_BASE}/api/story-arc`);
  return res.json();
}

export async function fetchStoryArc(slug) {
  const res = await fetch(`${API_BASE}/api/story-arc/${slug}`);
  return res.json();
}

export async function generateBriefing(topic, language = 'en') {
  const response = await fetch(`${API_BASE}/api/news-navigator`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, language }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate briefing.");
  }

  return response.json();
}

export async function askQuestion(question, briefing, sources, articles = []) {
  const response = await fetch(`${API_BASE}/api/news-navigator/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, briefing, sources, articles }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to get an answer.");
  }

  return response.json();
}

export async function translateArticle(title, summary, content, targetLanguage) {
  const response = await fetch(`${API_BASE}/api/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      summary,
      content,
      target_language: targetLanguage,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Translation failed.");
  }

  return response.json();
}

export async function translateBatch(articles, targetLanguage) {
  const langMap = { hi: 'hindi', ta: 'tamil', te: 'telugu' };
  const response = await fetch(`${API_BASE}/api/translate-batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      articles: articles.map(a => ({ id: a.id, title: a.title, summary: a.summary })),
      target_language: langMap[targetLanguage] || targetLanguage,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Batch translation failed.");
  }

  return response.json();
}

export function streamMyET({ interests, language = 'en', onStatus, onComplete, onError }) {
  const url = new URL(`${API_BASE}/api/my-et/stream`);
  url.searchParams.set('lang', language || 'en');
  url.searchParams.set('interests', interests || '');

  const stream = new EventSource(url.toString());

  stream.addEventListener('status', (event) => {
    onStatus?.(event.data);
  });

  stream.addEventListener('complete', (event) => {
    try {
      const payload = JSON.parse(event.data || '[]');
      onComplete?.(Array.isArray(payload) ? payload : []);
    } catch {
      onError?.('Could not parse personalized feed payload.');
    } finally {
      stream.close();
    }
  });

  stream.addEventListener('error', (event) => {
    if (event?.data) {
      onError?.(event.data);
      stream.close();
      return;
    }

    onError?.('Connection interrupted while streaming My ET updates.');
    stream.close();
  });

  return () => stream.close();
}