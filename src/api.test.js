import { fetchArticles, fetchArticle, fetchMarketData, fetchCategories, fetchStoryArcs, fetchStoryArc } from './api';

global.fetch = vi.fn();

beforeEach(() => fetch.mockReset());

const mockJson = (data) => ({ json: () => Promise.resolve(data) });

test('fetchArticles — no category', async () => {
  fetch.mockResolvedValue(mockJson([]));
  await fetchArticles();
  expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/articles');
});

test('fetchArticles — with category', async () => {
  fetch.mockResolvedValue(mockJson([]));
  await fetchArticles('tech');
  expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/articles?category=tech');
});

test('fetchArticle — correct URL', async () => {
  fetch.mockResolvedValue(mockJson({}));
  await fetchArticle(42);
  expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/articles/42');
});

test('fetchMarketData — correct URL', async () => {
  fetch.mockResolvedValue(mockJson([]));
  await fetchMarketData();
  expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/market-data');
});

test('fetchCategories — correct URL', async () => {
  fetch.mockResolvedValue(mockJson([]));
  await fetchCategories();
  expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/categories');
});

test('fetchStoryArcs — correct URL', async () => {
  fetch.mockResolvedValue(mockJson([]));
  await fetchStoryArcs();
  expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/story-arc');
});

test('fetchStoryArc — correct URL with slug', async () => {
  fetch.mockResolvedValue(mockJson({}));
  await fetchStoryArc('rbi-rate-decision');
  expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/story-arc/rbi-rate-decision');
});
