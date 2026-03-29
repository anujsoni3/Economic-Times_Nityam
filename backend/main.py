from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import re
import time
import hashlib
from concurrent.futures import ThreadPoolExecutor, as_completed
import feedparser
import yfinance as yf
from fastapi import HTTPException
from sse_starlette.sse import EventSourceResponse

try:
    from my_et_agent import my_et_agent_app
except ImportError:
    my_et_agent_app = None

from dotenv import load_dotenv
load_dotenv()

from groq import Groq

# Configure Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


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

REGIONAL_RSS = {
    "hi": {
        "top": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=hi&gl=IN&ceid=IN:hi",
        "markets": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=hi&gl=IN&ceid=IN:hi",
        "industry": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=hi&gl=IN&ceid=IN:hi",
        "tech": "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=hi&gl=IN&ceid=IN:hi",
        "wealth": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=hi&gl=IN&ceid=IN:hi",
        "economy": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=hi&gl=IN&ceid=IN:hi",
        "politics": "https://news.google.com/rss/headlines/section/topic/NATION?hl=hi&gl=IN&ceid=IN:hi",
    },
    "ta": {
        "top": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ta&gl=IN&ceid=IN:ta",
        "markets": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ta&gl=IN&ceid=IN:ta",
        "industry": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ta&gl=IN&ceid=IN:ta",
        "tech": "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=ta&gl=IN&ceid=IN:ta",
        "wealth": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ta&gl=IN&ceid=IN:ta",
        "economy": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ta&gl=IN&ceid=IN:ta",
        "politics": "https://news.google.com/rss/headlines/section/topic/NATION?hl=ta&gl=IN&ceid=IN:ta",
    },
    "te": {
        "top": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=te&gl=IN&ceid=IN:te",
        "markets": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=te&gl=IN&ceid=IN:te",
        "industry": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=te&gl=IN&ceid=IN:te",
        "tech": "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=te&gl=IN&ceid=IN:te",
        "wealth": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=te&gl=IN&ceid=IN:te",
        "economy": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=te&gl=IN&ceid=IN:te",
        "politics": "https://news.google.com/rss/headlines/section/topic/NATION?hl=te&gl=IN&ceid=IN:te",
    }
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
    """Extract image URL from RSS entry.
    ET RSS feeds carry no image data at all — only title/link/published.
    For ET article links we derive the image directly from the msid in the URL
    (https://img.etimg.com/thumb/msid-{id},...) which always resolves.
    For other feeds we fall back to media tags / enclosures / inline <img>.
    """
    link = entry.get("link", "")

    # ET articles: derive image from msid in URL — zero extra HTTP calls
    if "economictimes.indiatimes.com" in link:
        m = re.search(r"/articleshow/(\d+)\.cms", link)
        if m:
            return f"https://img.etimg.com/thumb/msid-{m.group(1)},width-650,height-488,resizemode-75/articleshow.jpg"

    # media:content
    if hasattr(entry, "media_content") and entry.media_content:
        url = entry.media_content[0].get("url", "")
        if url:
            return url
    # media:thumbnail
    if hasattr(entry, "media_thumbnail") and entry.media_thumbnail:
        url = entry.media_thumbnail[0].get("url", "")
        if url:
            return url
    # enclosures
    if hasattr(entry, "enclosures") and entry.enclosures:
        for enc in entry.enclosures:
            if "image" in enc.get("type", ""):
                return enc.get("href", "")
    # inline <img> in description / summary / content
    for field in ["description", "summary", "content"]:
        raw = entry.get(field, "")
        if isinstance(raw, list):
            raw = " ".join(c.get("value", "") for c in raw if isinstance(c, dict))
        if raw:
            img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', raw)
            if img_match:
                url = img_match.group(1)
                if url.startswith("http"):
                    return url
    return ""


def _parse_rss_entry(entry, category: str, idx: int, lang: str = "en") -> dict:
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
        "source_lang": lang,
    }


def _fetch_live_articles(category: str = None, lang: str = "en") -> list:
    """Fetch real articles from ET or Regional RSS feeds with caching (parallel)."""
    feeds_dict = ET_RSS_FEEDS if lang == "en" else REGIONAL_RSS.get(lang, ET_RSS_FEEDS)

    feeds_to_fetch = {}
    if category and category.lower() in feeds_dict:
        feeds_to_fetch = {category.lower(): feeds_dict[category.lower()]}
    else:
        feeds_to_fetch = feeds_dict

    all_articles = []
    uncached_feeds = {}

    # Collect cached feeds first
    for cat_key, url in feeds_to_fetch.items():
        cache_key = f"rss_{lang}_{cat_key}"
        cached = _get_cache(cache_key, CACHE_TTL_ARTICLES)
        if cached is not None:
            all_articles.extend(cached)
        else:
            uncached_feeds[cat_key] = url

    # Fetch uncached feeds in parallel
    if uncached_feeds:
        def _fetch_single_feed(cat_key, url):
            try:
                feed = feedparser.parse(url)
                articles = [
                    _parse_rss_entry(e, cat_key, i, lang)
                    for i, e in enumerate(feed.entries[:15])
                ]
                _set_cache(f"rss_{lang}_{cat_key}", articles)
                return articles
            except Exception as e:
                print(f"[RSS] Error fetching {cat_key}: {e}")
                return []

        with ThreadPoolExecutor(max_workers=7) as executor:
            futures = {
                executor.submit(_fetch_single_feed, ck, u): ck
                for ck, u in uncached_feeds.items()
            }
            for future in as_completed(futures, timeout=10):
                try:
                    all_articles.extend(future.result())
                except Exception:
                    pass

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
    """Fetch real-time market data from Yahoo Finance (parallel)."""
    cache_key = "market_live"
    cached = _get_cache(cache_key, CACHE_TTL_MARKET)
    if cached is not None:
        return cached

    results = []

    def _fetch_single_ticker(symbol, meta):
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="2d")
            if len(hist) < 1:
                return None
            current = float(hist["Close"].iloc[-1])
            previous = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else current
            change = current - previous
            pct = (change / previous * 100) if previous else 0
            return {
                "id": meta["id"],
                "name": meta["name"],
                "value": round(current, 2),
                "change": round(change, 2),
                "changePercent": round(pct, 2),
                "trend": "up" if change >= 0 else "down",
            }
        except Exception as e:
            print(f"[yfinance] Error for {symbol}: {e}")
            return None

    try:
        with ThreadPoolExecutor(max_workers=7) as executor:
            futures = {
                executor.submit(_fetch_single_ticker, sym, meta): sym
                for sym, meta in MARKET_SYMBOLS.items()
            }
            for future in as_completed(futures, timeout=15):
                try:
                    r = future.result()
                    if r:
                        results.append(r)
                except Exception:
                    pass

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
def get_articles(category: str | None = Query(None), lang: str = Query("en")):
    """Live articles from ET RSS. Falls back to static JSON."""
    try:
        articles = _fetch_live_articles(category, lang)
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


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  STORY ARC ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STORY_KEYWORDS: dict = {
    "rbi-rate-decision":  {"name": "RBI Rate Decisions",       "keywords": ["rbi", "repo rate", "monetary policy", "reserve bank", "mpc"]},
    "adani-hindenburg":   {"name": "Adani–Hindenburg Saga",    "keywords": ["adani", "hindenburg"]},
    "tata-apple-iphone":  {"name": "Tata–Apple iPhone Deal",   "keywords": ["tata", "apple", "iphone"]},
    "reliance-jio":       {"name": "Reliance Jio Expansion",   "keywords": ["reliance", "jio", "telecom"]},
    "union-budget":       {"name": "Union Budget 2025",        "keywords": ["budget", "union budget", "finance minister", "nirmala"]},
    "startup-funding":    {"name": "Startup Funding Wave",     "keywords": ["startup", "funding", "unicorn", "series a", "series b"]},
    "rupee-dollar":       {"name": "Rupee vs Dollar",          "keywords": ["rupee", "dollar", "forex", "usd inr"]},
    "ipo-wave":           {"name": "IPO & Listing Frenzy",     "keywords": ["ipo", "listing", "sebi", "primary market"]},
    "inflation-watch":    {"name": "Inflation Watch",          "keywords": ["inflation", "cpi", "wpi", "price rise"]},
    "it-sector":          {"name": "IT Sector Outlook",        "keywords": ["infosys", "wipro", "tcs", "tech layoff", "it sector"]},
}


def _match_story(title: str, summary: str) -> str | None:
    text = (title + " " + summary).lower()
    for slug, cfg in STORY_KEYWORDS.items():
        if any(kw in text for kw in cfg["keywords"]):
            return slug
    return None


@app.get("/api/story-arc")
def get_story_arcs():
    articles = _fetch_live_articles()
    stories: dict = {}
    for article in articles:
        slug = _match_story(article.get("title", ""), article.get("summary", ""))
        if not slug:
            slug = article.get("category", "general").lower().replace(" ", "-")
        if slug not in stories:
            cfg = STORY_KEYWORDS.get(slug, {})
            stories[slug] = {
                "slug": slug,
                "name": cfg.get("name", article.get("category", "General")),
                "category": article.get("category", ""),
                "articles": [],
            }
        stories[slug]["articles"].append(article)
    return [s for s in stories.values() if len(s["articles"]) >= 2]


@app.get("/api/story-arc/{slug}")
def get_story_arc(slug: str):
    for arc in get_story_arcs():
        if arc["slug"] == slug:
            return arc
    return {"error": "Story arc not found", "slug": slug}









# --- New Imports (add alongside existing ones) ---
# from anthropic import Anthropic  # Uncomment if using real Claude
from typing import Any

# ─────────────────────────────────────────────
# HELPER: Fetch articles for a topic via RSS
# (Reuses the same RSS pattern your existing code uses)
# ─────────────────────────────────────────────
def _topic_tokens(topic: str) -> list[str]:
    stop_words = {
        "the", "and", "for", "with", "from", "that", "this", "about", "into",
        "over", "under", "after", "before", "have", "has", "had", "will", "would",
        "could", "should", "india", "indian", "news",
    }
    raw = re.split(r"[^a-zA-Z0-9]+", topic.lower())
    tokens = [t for t in raw if len(t) >= 3 and t not in stop_words]
    return tokens


def _score_article_for_topic(article: dict[str, Any], tokens: list[str], phrases: list[str]) -> int:
    text = " ".join(
        [
            str(article.get("title", "")),
            str(article.get("summary", "")),
            str(article.get("category", "")),
            " ".join(article.get("tags", []) or []),
        ]
    ).lower()

    score = 0
    for phrase in phrases:
        if phrase and phrase in text:
            score += 5

    for token in tokens:
        if token in text:
            score += 2
        if text.count(token) > 1:
            score += 1

    return score


async def fetch_articles_for_topic(topic: str, lang: str = "en") -> list[dict]:
    """Fetch related articles from already integrated regional feeds, then rank by topic relevance."""
    candidates = _fetch_live_articles(lang=lang)
    if not candidates:
        return []

    tokens = _topic_tokens(topic)
    phrases = [p.strip().lower() for p in topic.split(",") if p.strip()]

    scored = []
    for article in candidates:
        score = _score_article_for_topic(article, tokens, phrases)
        if score > 0:
            scored.append((score, article))

    # If strict matching yields nothing, fall back to latest headlines for resilience.
    if not scored:
        scored = [(1, a) for a in candidates[:12]]

    scored.sort(key=lambda item: item[0], reverse=True)

    seen = set()
    deduped = []
    for score, article in scored:
        dedupe_key = str(article.get("id") or article.get("link") or article.get("title", "")).strip().lower()
        if not dedupe_key or dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        deduped.append(
            {
                "id": article.get("id"),
                "title": article.get("title", ""),
                "summary": article.get("summary", ""),
                "link": article.get("link", ""),
                "category": article.get("category", "Top Stories"),
                "publishedAt": article.get("publishedAt", ""),
                "relevance_score": score,
            }
        )
        if len(deduped) >= 12:
            break

    return deduped


def _safe_json_loads(text: str) -> dict:
    cleaned = (text or "").strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


def _fallback_briefing(topic: str, articles: list[dict]) -> dict:
    top = articles[:6]
    combined = " ".join((a.get("summary") or a.get("title") or "") for a in top)
    combined = re.sub(r"\s+", " ", combined).strip()
    what_happened = combined[:560] + ("..." if len(combined) > 560 else "")

    categories = [a.get("category", "Top Stories") for a in top]
    category_summary = ", ".join(sorted(set(c for c in categories if c))) or "Top Stories"

    return {
        "topic": topic,
        "briefing": {
            "what_happened": what_happened or f"Recent coverage related to '{topic}' was compiled from multiple headlines.",
            "key_players": "Key players are inferred from the linked headlines and include organisations, regulators, and market participants mentioned across sources.",
            "impact": f"Coverage indicates immediate implications across: {category_summary}. Broader impact depends on policy response, market follow-through, and corporate execution.",
            "whats_next": "Watch for official announcements, earnings/policy updates, and follow-up developments in the same topic cluster.",
        },
        "sources": [{"title": a.get("title", "Untitled"), "link": a.get("link", "")} for a in top],
        "matched_articles": top,
    }


# ─────────────────────────────────────────────
# HELPER: Call Claude to generate a briefing
# ─────────────────────────────────────────────
async def call_claude_briefing(topic: str, articles: list[dict]) -> dict:
    """Generate a combined structured briefing from fetched related articles."""
    articles_text = "\n\n".join(
        f"Title: {a['title']}\nSummary: {a['summary']}\nLink: {a['link']}"
        for a in articles
    )

    prompt = f"""You are a professional business news analyst.
You must synthesize multiple related articles into one concise combined briefing.

TOPIC: {topic}

RELATED ARTICLES:
{articles_text}

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{{
  "topic": "{topic}",
  "briefing": {{
    "what_happened": "2-3 sentence summary of the main event",
    "key_players": "People, organisations, or governments involved",
    "impact": "Short-term and long-term consequences",
    "whats_next": "What to watch for next"
  }},
  "sources": [
    {{"title": "Article title", "link": "Article URL"}}
  ],
  "matched_articles": [
    {{"id": 123, "title": "...", "summary": "...", "link": "...", "category": "...", "publishedAt": "..."}}
  ]
}}"""

    if not groq_client:
        return _fallback_briefing(topic, articles)

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You synthesize related news into concise business briefings. Always return valid JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            max_tokens=1800,
            response_format={"type": "json_object"},
        )
        result = _safe_json_loads(chat_completion.choices[0].message.content)
        if "briefing" not in result or "sources" not in result:
            return _fallback_briefing(topic, articles)
        result["topic"] = result.get("topic") or topic
        result["matched_articles"] = result.get("matched_articles") or articles[:6]
        return result
    except Exception as e:
        print(f"[NewsNavigator] Briefing fallback due to error: {e}")
        return _fallback_briefing(topic, articles)


# ─────────────────────────────────────────────
# HELPER: Call Claude for Q&A
# ─────────────────────────────────────────────
async def call_claude_qa(question: str, briefing: dict, sources: list[dict], articles: list[dict]) -> dict:
    """Answer follow-up questions grounded in generated briefing and fetched related articles."""
    briefing_text = (
        f"What Happened: {briefing.get('what_happened', '')}\n"
        f"Key Players: {briefing.get('key_players', '')}\n"
        f"Impact: {briefing.get('impact', '')}\n"
        f"What's Next: {briefing.get('whats_next', '')}"
    )
    sources_text = "\n".join(f"- {s['title']}: {s['link']}" for s in sources)
    articles_text = "\n".join(
        f"- {a.get('title', '')}: {a.get('summary', '')}"
        for a in (articles or [])[:8]
    )

    prompt = f"""You are a news Q&A assistant. Answer the user's question STRICTLY using the briefing below.

BRIEFING:
{briefing_text}

SOURCES:
{sources_text}

FETCHED ARTICLE EXCERPTS:
{articles_text}

QUESTION: {question}

Rules:
- Answer ONLY from the briefing. Do not add outside knowledge.
- If the question cannot be answered from the briefing, reply exactly: "This is not covered in the current briefing."
- Always cite the relevant source titles at the end of your answer.
- Keep your answer concise (2-4 sentences max).

Return ONLY valid JSON (no markdown):
{{
  "answer": "Your answer here",
  "citations": [{{"title": "Source title", "link": "Source URL"}}]
}}"""

    if not groq_client:
        fallback_parts = [
            briefing.get("what_happened", ""),
            briefing.get("impact", ""),
            briefing.get("whats_next", ""),
        ]
        fallback_text = " ".join(p for p in fallback_parts if p).strip()
        return {
            "answer": fallback_text[:420] if fallback_text else "This is not covered in the current briefing.",
            "citations": sources[:2] if sources else [],
        }

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "Answer questions strictly from provided briefing context. Always return valid JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            max_tokens=800,
            response_format={"type": "json_object"},
        )
        result = _safe_json_loads(chat_completion.choices[0].message.content)
        if "answer" not in result:
            raise ValueError("Missing answer in model output")
        if "citations" not in result:
            result["citations"] = sources[:2] if sources else []
        return result
    except Exception as e:
        print(f"[NewsNavigator] QA fallback due to error: {e}")
        return {
            "answer": "This is not covered in the current briefing.",
            "citations": sources[:2] if sources else [],
        }


# ─────────────────────────────────────────────
# PYDANTIC MODELS — add alongside existing models
# ─────────────────────────────────────────────
from pydantic import BaseModel, Field

class NewsNavigatorRequest(BaseModel):
    topic: str
    language: str = "en"

class NewsNavigatorAskRequest(BaseModel):
    question: str
    briefing: dict
    sources: list[dict] = Field(default_factory=list)
    articles: list[dict] = Field(default_factory=list)

class TranslateRequest(BaseModel):
    title: str
    summary: str
    content: str
    target_language: str  # "hindi", "tamil", "telugu"


# ─────────────────────────────────────────────
# ENDPOINT 1: Generate briefing
# ─────────────────────────────────────────────
@app.post("/api/news-navigator")
async def news_navigator(request: NewsNavigatorRequest):
    """Fetch articles for a topic and return an AI-generated briefing."""
    if not request.topic or not request.topic.strip():
        raise HTTPException(status_code=400, detail="Topic is required.")

    lang = (request.language or "en").strip().lower()
    if lang not in {"en", "hi", "ta", "te"}:
        lang = "en"

    topic = request.topic.strip()
    articles = await fetch_articles_for_topic(topic, lang=lang)
    if not articles:
        raise HTTPException(status_code=404, detail="No articles found for this topic.")

    result = await call_claude_briefing(topic, articles)
    result["language"] = lang
    return result


# ─────────────────────────────────────────────
# ENDPOINT 2: Answer follow-up question
# ─────────────────────────────────────────────
@app.post("/api/news-navigator/ask")
async def news_navigator_ask(request: NewsNavigatorAskRequest):
    """Answer a follow-up question strictly from the provided briefing."""
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question is required.")
    if not request.briefing:
        raise HTTPException(status_code=400, detail="Briefing is required.")

    result = await call_claude_qa(
        request.question.strip(),
        request.briefing,
        request.sources or [],
        request.articles or [],
    )
    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  VERNACULAR ENGINE — Culturally-Adapted Translation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LANG_CONFIG = {
    "hindi": {
        "name": "Hindi",
        "native": "हिंदी",
        "script": "Devanagari",
        "region": "Hindi-speaking belt (UP, MP, Bihar, Rajasthan, Delhi NCR, Jharkhand, Chhattisgarh)",
        "cultural_notes": "Use common Hindi idioms. Reference local markets like Dalal Street as 'दलाल स्ट्रीट'. Use ₹ symbol. Mention relatable examples — chai tapri economics, kirana store owners, LIC policies, SBI accounts, ration cards, PM schemes.",
    },
    "tamil": {
        "name": "Tamil",
        "native": "தமிழ்",
        "script": "Tamil",
        "region": "Tamil Nadu, Puducherry, northern Sri Lanka",
        "cultural_notes": "Reference Chennai's financial district, Coimbatore's textile industry, Madurai's trade markets. Use Tamil Nadu-specific context — Amma canteens, TASMAC, Koyambedu market rates, auto fare economics. Retain English for technical terms but explain in Tamil.",
    },
    "telugu": {
        "name": "Telugu",
        "native": "తెలుగు",
        "script": "Telugu",
        "region": "Andhra Pradesh, Telangana",
        "cultural_notes": "Reference Hyderabad's IT corridor, Vizag's industrial growth, Amaravati development. Use Telugu-speaking area context — Rythu Bazaars, GHMC, Tollywood economics, pearl farming, pharma city. Retain English for financial terms but explain in Telugu.",
    },
}


def _build_translation_prompt(title: str, summary: str, content: str, lang_key: str) -> str:
    lang = LANG_CONFIG[lang_key]
    return f"""You are an expert Indian business news translator and cultural adapter. 
Translate the following English business news article into {lang['name']} ({lang['script']} script).

CRITICAL RULES:
1. DO NOT do literal word-by-word translation. Culturally ADAPT the content.
2. Use natural {lang['name']} as spoken by educated professionals — not textbook {lang['name']}.
3. Keep brand names, company names, and proper nouns in English.
4. Keep numbers and currency in their original form (₹, %, etc.).
5. {lang['cultural_notes']}
6. For the "regional_context" field, explain how this news specifically impacts people in {lang['region']}. Add LOCAL context that doesn't exist in the English article — mention local businesses, state policies, regional market impacts, or how a common person in that region would be affected.
7. For "glossary", extract 3-5 key financial/business terms from the article and provide:
   - The English term
   - Translation in {lang['name']}
   - A simple 1-line explanation in {lang['name']} that a non-finance person would understand

ARTICLE TO TRANSLATE:
Title: {title}
Summary: {summary}
Content: {content}

Return ONLY valid JSON (no markdown, no backticks, no extra text):
{{
  "translated_title": "Title in {lang['name']}",
  "translated_summary": "Summary in {lang['name']} (2-3 sentences)",
  "translated_content": "Full content in {lang['name']}",
  "regional_context": "2-3 sentences about how this news impacts {lang['region']} specifically. Write in {lang['name']}.",
  "glossary": [
    {{
      "term": "English term",
      "translation": "Term in {lang['name']}",
      "explanation": "Simple explanation in {lang['name']}"
    }}
  ],
  "adaptation_notes": "Brief English note about what cultural adaptations were made"
}}"""


@app.post("/api/translate")
async def translate_article(request: TranslateRequest):
    """Translate an article with cultural adaptation using Groq (Llama 3.3 70B)."""
    lang_key = request.target_language.lower().strip()
    if lang_key not in LANG_CONFIG:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {lang_key}. Supported: {list(LANG_CONFIG.keys())}",
        )

    if not groq_client:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured.")

    # Check cache first
    cache_key = f"translate_{hashlib.md5((request.title + lang_key).encode()).hexdigest()}"
    cached = _get_cache(cache_key, 600)  # 10 min cache
    if cached is not None:
        return cached

    prompt = _build_translation_prompt(
        request.title, request.summary, request.content, lang_key
    )

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert Indian business news translator. Always respond with valid JSON only, no markdown.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )

        text = chat_completion.choices[0].message.content.strip()

        # Clean potential markdown wrapping
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)

        result = json.loads(text)
        result["language"] = lang_key
        result["language_native"] = LANG_CONFIG[lang_key]["native"]

        _set_cache(cache_key, result)
        return result

    except json.JSONDecodeError as e:
        print(f"[Translate] JSON parse error: {e}")
        print(f"[Translate] Raw response: {text[:500]}")
        raise HTTPException(status_code=500, detail="Translation response was not valid JSON.")
    except Exception as e:
        print(f"[Translate] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


# ─────────────────────────────────────────────
# BATCH TRANSLATE — translate all article headlines at once
# ─────────────────────────────────────────────
class BatchTranslateRequest(BaseModel):
    articles: list[dict]  # [{id, title, summary}]
    target_language: str


@app.post("/api/translate-batch")
async def translate_batch(request: BatchTranslateRequest):
    """Translate multiple article titles & summaries in one API call."""
    lang_key = request.target_language.lower().strip()
    if lang_key not in LANG_CONFIG:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {lang_key}")

    if not groq_client:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured.")

    # Check cache
    ids_str = "_".join(str(a.get("id", "")) for a in request.articles[:60])
    cache_key = f"batch_{lang_key}_{hashlib.md5(ids_str.encode()).hexdigest()}"
    cached = _get_cache(cache_key, 600)
    if cached is not None:
        return cached

    lang = LANG_CONFIG[lang_key]
    articles_text = "\n".join(
        f'{i+1}. ID={a.get("id","")}\n   Title: {a.get("title","")}\n   Summary: {a.get("summary","")[:200]}'
        for i, a in enumerate(request.articles[:60])  # Cap at 60
    )

    prompt = f"""Translate these article headlines and summaries into {lang['name']} ({lang['script']} script).

RULES:
- Culturally adapt, don't literally translate
- Keep brand names, numbers, and ₹/% symbols as-is
- {lang['cultural_notes']}

ARTICLES:
{articles_text}

Return ONLY valid JSON (no markdown):
{{
  "translations": [
    {{
      "id": original_article_id,
      "translated_title": "Title in {lang['name']}",
      "translated_summary": "Summary in {lang['name']}"
    }}
  ]
}}"""

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a news headline translator. Respond with valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )

        text = chat_completion.choices[0].message.content.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)

        result = json.loads(text)
        _set_cache(cache_key, result)
        return result

    except Exception as e:
        print(f"[BatchTranslate] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Batch translation failed: {str(e)}")


# ─────────────────────────────────────────────
# UI Translations for entire app
# ─────────────────────────────────────────────
UI_TRANSLATIONS = {
    "en": {
        "home": "Home", "markets": "Markets", "industry": "Industry",
        "tech": "Tech", "economy": "Economy", "wealth": "Wealth",
        "startups": "Startups", "politics": "Politics", "storyArc": "Story Arc",
        "newsNavigator": "News Navigator", "myET": "My ET",
        "search": "Search news...", "readMore": "Read More",
        "minRead": "min read", "relatedStories": "Related Stories",
        "aiFeatures": "AI-Powered Features", "featureSlots": "Integration slots for each teammate's AI feature",
        "readIn": "Read this in", "translating": "Translating...",
        "culturallyAdapted": "Culturally Adapted", "regionalImpact": "Regional Impact",
        "glossary": "Key Terms Explained", "originalArticle": "Original Article",
        "bilingual": "Bilingual View", "backToEnglish": "Back to English",
        "live": "LIVE", "news": "News", "investing": "Investing",
        "mutualFunds": "Mutual Funds", "ipo": "IPO", "commodities": "Commodities",
        "vernacularEngine": "Vernacular Engine",
        "footerDesc": "India's leading financial newspaper. Bringing you the most comprehensive business news, market analysis, and expert opinions — now powered by AI.",
        "footerCopy": "© 2026 The Economic Times — ET GenAI Hackathon. Built with ❤️ for the future of news.",
    },
    "hi": {
        "home": "होम", "markets": "बाज़ार", "industry": "उद्योग",
        "tech": "टेक", "economy": "अर्थव्यवस्था", "wealth": "सम्पत्ति",
        "startups": "स्टार्टअप", "politics": "राजनीति", "storyArc": "स्टोरी आर्क",
        "newsNavigator": "न्यूज़ नेविगेटर", "myET": "मेरा ET",
        "search": "समाचार खोजें...", "readMore": "और पढ़ें",
        "minRead": "मिनट पढ़ने का समय", "relatedStories": "संबंधित खबरें",
        "aiFeatures": "AI-संचालित फीचर्स", "featureSlots": "हर टीममेट के AI फीचर के लिए इंटीग्रेशन स्लॉट",
        "readIn": "इसे पढ़ें", "translating": "अनुवाद हो रहा है...",
        "culturallyAdapted": "सांस्कृतिक रूप से अनुकूलित", "regionalImpact": "क्षेत्रीय प्रभाव",
        "glossary": "प्रमुख शब्दों की व्याख्या", "originalArticle": "मूल लेख",
        "bilingual": "द्विभाषी दृश्य", "backToEnglish": "अंग्रेज़ी में वापस",
        "live": "लाइव", "news": "समाचार", "investing": "निवेश",
        "mutualFunds": "म्यूचुअल फंड", "ipo": "आईपीओ", "commodities": "कमोडिटीज़",
        "vernacularEngine": "वर्नाक्युलर इंजन",
        "footerDesc": "भारत का प्रमुख वित्तीय समाचार पत्र। सबसे व्यापक बिज़नेस न्यूज़, बाज़ार विश्लेषण और विशेषज्ञ राय — अब AI की शक्ति के साथ।",
        "footerCopy": "© 2026 द इकोनॉमिक टाइम्स — ET GenAI हैकाथॉन। समाचार के भविष्य के लिए ❤️ से बनाया गया।",
    },
    "ta": {
        "home": "முகப்பு", "markets": "சந்தைகள்", "industry": "தொழில்",
        "tech": "தொழில்நுட்பம்", "economy": "பொருளாதாரம்", "wealth": "செல்வம்",
        "startups": "ஸ்டார்ட்அப்", "politics": "அரசியல்", "storyArc": "ஸ்டோரி ஆர்க்",
        "newsNavigator": "நியூஸ் நேவிகேட்டர்", "myET": "எனது ET",
        "search": "செய்திகளைத் தேடுங்கள்...", "readMore": "மேலும் படிக்க",
        "minRead": "நிமிடம் படிக்க", "relatedStories": "தொடர்புடைய செய்திகள்",
        "aiFeatures": "AI-இயக்கும் அம்சங்கள்", "featureSlots": "ஒவ்வொரு குழு உறுப்பினரின் AI அம்சத்திற்கான ஒருங்கிணைப்பு ஸ்லாட்",
        "readIn": "இதைப் படிக்கவும்", "translating": "மொழிபெயர்க்கப்படுகிறது...",
        "culturallyAdapted": "கலாச்சார ரீதியாக தழுவப்பட்டது", "regionalImpact": "பிராந்திய தாக்கம்",
        "glossary": "முக்கிய சொற்கள் விளக்கம்", "originalArticle": "அசல் கட்டுரை",
        "bilingual": "இருமொழி காட்சி", "backToEnglish": "ஆங்கிலத்தில் திரும்பு",
        "live": "நேரலை", "news": "செய்திகள்", "investing": "முதலீடு",
        "mutualFunds": "மியூச்சுவல் ஃபண்ட்", "ipo": "ஐபிஓ", "commodities": "பண்டங்கள்",
        "vernacularEngine": "வெர்னாக்குலர் இன்ஜின்",
        "footerDesc": "இந்தியாவின் முன்னணி நிதி செய்தித்தாள். மிக விரிவான வணிக செய்திகள், சந்தை பகுப்பாய்வு மற்றும் நிபுணர் கருத்துக்கள் — இப்போது AI இன் சக்தியுடன்.",
        "footerCopy": "© 2026 தி எகனாமிக் டைம்ஸ் — ET GenAI ஹேக்கத்தான். செய்திகளின் எதிர்காலத்திற்காக ❤️ உடன் உருவாக்கப்பட்டது.",
    },
    "te": {
        "home": "హోమ్", "markets": "మార్కెట్లు", "industry": "పరిశ్రమ",
        "tech": "టెక్", "economy": "ఆర్థిక వ్యవస్థ", "wealth": "సంపద",
        "startups": "స్టార్టప్‌లు", "politics": "రాజకీయాలు", "storyArc": "స్టోరీ ఆర్క్",
        "newsNavigator": "న్యూస్ నావిగేటర్", "myET": "నా ET",
        "search": "వార్తలు వెతకండి...", "readMore": "మరింత చదవండి",
        "minRead": "నిమిషాల చదువు", "relatedStories": "సంబంధిత కథనాలు",
        "aiFeatures": "AI-ఆధారిత ఫీచర్లు", "featureSlots": "ప్రతి టీమ్‌మేట్ AI ఫీచర్ కోసం ఇంటిగ్రేషన్ స్లాట్",
        "readIn": "దీన్ని చదవండి", "translating": "అనువదిస్తోంది...",
        "culturallyAdapted": "సాంస్కృతికంగా అనుకూలీకరించబడింది", "regionalImpact": "ప్రాంతీయ ప్రభావం",
        "glossary": "కీలక పదాల వివరణ", "originalArticle": "అసలు వ్యాసం",
        "bilingual": "ద్విభాషా వీక్షణ", "backToEnglish": "ఆంగ్లంలోకి తిరిగి",
        "live": "లైవ్", "news": "వార్తలు", "investing": "పెట్టుబడి",
        "mutualFunds": "మ్యూచువల్ ఫండ్స్", "ipo": "ఐపీఓ", "commodities": "కమోడిటీస్",
        "vernacularEngine": "వెర్నాక్యులర్ ఇంజిన్",
        "footerDesc": "భారతదేశపు ప్రముఖ ఆర్థిక వార్తాపత్రిక. అత్యంత సమగ్రమైన వ్యాపార వార్తలు, మార్కెట్ విశ్లేషణ మరియు నిపుణుల అభిప్రాయాలు — ఇప్పుడు AI శక్తితో.",
        "footerCopy": "© 2026 ది ఎకనామిక్ టైమ్స్ — ET GenAI హ్యాకథాన్. వార్తల భవిష్యత్తు కోసం ❤️ తో నిర్మించబడింది.",
    },
}


@app.get("/api/ui-translations")
def get_ui_translations(lang: str = Query("en")):
    """Return UI string translations for the given language code."""
    return UI_TRANSLATIONS.get(lang, UI_TRANSLATIONS["en"])


@app.get("/api/my-et/stream")
async def stream_my_et(lang: str = Query("en"), interests: str = Query("")):
    """Stream LangGraph events and final personalized feed via SSE."""
    if not my_et_agent_app:
        raise HTTPException(status_code=500, detail="LangGraph Agent failed to import.")
    if not interests.strip():
        raise HTTPException(status_code=400, detail="Interests strictly required.")

    async def event_generator():
        yield {"event": "status", "data": "[System] Initializing Fetch Agent..."}
        try:
            # 1. Fetch raw articles outside graph
            raw_articles = _fetch_live_articles(category=None, lang=lang)[:50]
            yield {"event": "status", "data": f"[System] {len(raw_articles)} raw headlines retrieved."}
            
            initial_state = {
                "interests": interests,
                "language": lang,
                "raw_articles": raw_articles,
                "filtered_articles": [],
                "final_feed": [],
                "messages": []
            }
            
            seen_messages = set()
            final_feed = []
            for output in my_et_agent_app.stream(initial_state):
                for node_name, state_update in output.items():
                    if "messages" in state_update:
                        for msg in state_update["messages"]:
                            if msg not in seen_messages:
                                yield {"event": "status", "data": msg}
                                seen_messages.add(msg)

                    if "final_feed" in state_update:
                        final_feed = state_update["final_feed"] or []

            yield {"event": "complete", "data": json.dumps(final_feed)}
        except Exception as e:
            yield {"event": "error", "data": str(e)}

    return EventSourceResponse(event_generator())

