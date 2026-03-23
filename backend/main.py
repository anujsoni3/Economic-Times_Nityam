from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import re
import time
import hashlib
import feedparser
import yfinance as yf

app = FastAPI(title="ET News API", version="2.0.0")

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  In-memory cache
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_cache: dict = {}
CACHE_TTL_ARTICLES = 300   # 5 min
CACHE_TTL_MARKET = 60      # 1 min


def _get_cache(key: str, ttl: int):
    if key in _cache:
        data, ts = _cache[key]
        if time.time() - ts < ttl:
            return data
    return None


def _set_cache(key: str, data):
    _cache[key] = (data, time.time())


def _load_json(filename: str):
    with open(os.path.join(DATA_DIR, filename), "r", encoding="utf-8") as f:
        return json.load(f)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  LIVE NEWS — ET RSS Feeds (open-source, no API key)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ET_RSS_FEEDS = {
    "top":      "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
    "markets":  "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    "industry": "https://economictimes.indiatimes.com/industry/rssfeeds/13352306.cms",
    "tech":     "https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms",
    "wealth":   "https://economictimes.indiatimes.com/wealth/rssfeeds/837555174.cms",
    "economy":  "https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms",
    "politics": "https://economictimes.indiatimes.com/news/politics-and-nation/rssfeeds/1052732854.cms",
}

CATEGORY_DISPLAY = {
    "top": "Top Stories",
    "markets": "Markets",
    "industry": "Industry",
    "tech": "Tech",
    "wealth": "Wealth",
    "economy": "Economy",
    "politics": "Politics",
}


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text).strip()


def _extract_image(entry) -> str:
    """Try multiple ways to get an image from an RSS entry."""
    # media:content
    if hasattr(entry, "media_content") and entry.media_content:
        return entry.media_content[0].get("url", "")
    # media:thumbnail
    if hasattr(entry, "media_thumbnail") and entry.media_thumbnail:
        return entry.media_thumbnail[0].get("url", "")
    # enclosures
    if hasattr(entry, "enclosures") and entry.enclosures:
        for enc in entry.enclosures:
            if "image" in enc.get("type", ""):
                return enc.get("href", "")
    # try to find <img> in description
    desc = entry.get("description", "") or entry.get("summary", "")
    img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', desc)
    if img_match:
        return img_match.group(1)
    return ""


def _parse_rss_entry(entry, category: str, idx: int) -> dict:
    """Convert an RSS feed entry into our article format."""
    summary = _strip_html(entry.get("summary", "") or entry.get("description", ""))
    image_url = _extract_image(entry)
    link = entry.get("link", "")

    # Stable numeric ID from the article link
    link_hash = int(hashlib.md5(link.encode()).hexdigest()[:8], 16)

    return {
        "id": link_hash,
        "title": _strip_html(entry.get("title", "")),
        "summary": summary[:400] + ("..." if len(summary) > 400 else ""),
        "content": summary,
        "category": CATEGORY_DISPLAY.get(category, "Top Stories"),
        "imageUrl": image_url,
        "author": entry.get("author", "ET Bureau"),
        "publishedAt": entry.get("published", entry.get("updated", "")),
        "readTime": max(2, len(summary.split()) // 200),
        "link": link,
        "tags": [category],
    }


def _fetch_live_articles(category: str = None) -> list:
    """Fetch real articles from ET RSS feeds with caching."""
    feeds_to_fetch = {}
    if category and category.lower() in ET_RSS_FEEDS:
        feeds_to_fetch = {category.lower(): ET_RSS_FEEDS[category.lower()]}
    else:
        feeds_to_fetch = ET_RSS_FEEDS

    all_articles = []
    for cat_key, url in feeds_to_fetch.items():
        cache_key = f"rss_{cat_key}"
        cached = _get_cache(cache_key, CACHE_TTL_ARTICLES)
        if cached is not None:
            all_articles.extend(cached)
            continue

        try:
            feed = feedparser.parse(url)
            articles = [
                _parse_rss_entry(e, cat_key, i)
                for i, e in enumerate(feed.entries[:15])
            ]
            _set_cache(cache_key, articles)
            all_articles.extend(articles)
        except Exception as e:
            print(f"[RSS] Error fetching {cat_key}: {e}")

    return all_articles


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  LIVE MARKET DATA — yfinance (open-source, no API key)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MARKET_SYMBOLS = {
    "^BSESN":    {"name": "SENSEX",      "id": "sensex"},
    "^NSEI":     {"name": "NIFTY 50",    "id": "nifty"},
    "^NSEBANK":  {"name": "BANK NIFTY",  "id": "banknifty"},
    "GC=F":      {"name": "GOLD (USD)",  "id": "gold"},
    "SI=F":      {"name": "SILVER (USD)","id": "silver"},
    "CL=F":      {"name": "CRUDE OIL",   "id": "crude"},
    "USDINR=X":  {"name": "USD/INR",     "id": "usdinr"},
}


def _fetch_live_market_data() -> list:
    """Fetch real-time market data from Yahoo Finance."""
    cache_key = "market_live"
    cached = _get_cache(cache_key, CACHE_TTL_MARKET)
    if cached is not None:
        return cached

    results = []
    try:
        symbols = list(MARKET_SYMBOLS.keys())
        tickers = yf.Tickers(" ".join(symbols))

        for symbol in symbols:
            try:
                meta = MARKET_SYMBOLS[symbol]
                ticker = tickers.tickers[symbol]
                hist = ticker.history(period="2d")

                if len(hist) < 1:
                    continue

                current = float(hist["Close"].iloc[-1])
                previous = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else current
                change = current - previous
                pct = (change / previous * 100) if previous else 0

                results.append({
                    "id": meta["id"],
                    "name": meta["name"],
                    "value": round(current, 2),
                    "change": round(change, 2),
                    "changePercent": round(pct, 2),
                    "trend": "up" if change >= 0 else "down",
                })
            except Exception as e:
                print(f"[yfinance] Error for {symbol}: {e}")

        if results:
            _set_cache(cache_key, results)
    except Exception as e:
        print(f"[yfinance] Batch error: {e}")

    # Fallback to static if yfinance totally fails
    if not results:
        try:
            results = _load_json("market_data.json")
        except Exception:
            pass

    return results


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REST API Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/api/articles")
def get_articles(category: str | None = Query(None)):
    """Live articles from ET RSS. Falls back to static JSON."""
    try:
        articles = _fetch_live_articles(category)
        if articles:
            return articles
    except Exception as e:
        print(f"[API] RSS failed, falling back: {e}")

    # Static fallback
    articles = _load_json("articles.json")
    if category:
        articles = [a for a in articles if a["category"].lower() == category.lower()]
    return articles


@app.get("/api/articles/{article_id}")
def get_article(article_id: int):
    """Single article by ID — searches live cache first, then static."""
    # Check RSS cache
    for key in list(_cache.keys()):
        if key.startswith("rss_"):
            data, _ = _cache[key]
            for a in data:
                if a["id"] == article_id:
                    return a

    # Static fallback
    for a in _load_json("articles.json"):
        if a["id"] == article_id:
            return a
    return {"error": "Article not found"}


@app.get("/api/market-data")
def get_market_data():
    """Live market data from Yahoo Finance."""
    return _fetch_live_market_data()


CATEGORIES = [
    {"slug": "markets",  "name": "Markets",  "color": "#e03d3d"},
    {"slug": "industry", "name": "Industry", "color": "#1a73e8"},
    {"slug": "tech",     "name": "Tech",     "color": "#7c3aed"},
    {"slug": "wealth",   "name": "Wealth",   "color": "#16a34a"},
    {"slug": "economy",  "name": "Economy",  "color": "#ea580c"},
    {"slug": "politics", "name": "Politics", "color": "#9333ea"},
]


@app.get("/api/categories")
def get_categories():
    return CATEGORIES


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "data_sources": {
            "news": "ET RSS Feeds (live)",
            "market": "Yahoo Finance / yfinance (live)",
        },
        "fallback": "static JSON",
    }
