const API_BASE = 'http://localhost:8000';

export async function fetchArticles(category = null) {
  const url = category
    ? `${API_BASE}/api/articles?category=${category}`
    : `${API_BASE}/api/articles`;
  const res = await fetch(url);
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
