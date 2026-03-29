import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app, _strip_html, _match_story, _get_cache, _set_cache, _parse_rss_entry, _cache

client = TestClient(app)


# ── Pure function tests ────────────────────────────────────────────────────────

def test_strip_html_removes_tags():
    assert _strip_html("<b>Hello</b> <i>World</i>") == "Hello World"

def test_strip_html_empty():
    assert _strip_html("") == ""

def test_strip_html_no_tags():
    assert _strip_html("plain text") == "plain text"

def test_match_story_rbi():
    assert _match_story("RBI repo rate hike announced", "") == "rbi-rate-decision"

def test_match_story_adani():
    assert _match_story("Adani shares fall sharply", "") == "adani-hindenburg"

def test_match_story_budget():
    assert _match_story("Union Budget 2025 highlights", "") == "union-budget"

def test_match_story_ipo():
    assert _match_story("New IPO listing today", "") == "ipo-wave"

def test_match_story_no_match():
    assert _match_story("random unrelated news", "") is None

def test_match_story_checks_summary():
    assert _match_story("Breaking news", "RBI monetary policy decision") == "rbi-rate-decision"


# ── Cache tests ────────────────────────────────────────────────────────────────

def test_cache_miss_returns_none():
    assert _get_cache("nonexistent_key", 60) is None

def test_cache_hit_returns_data():
    _set_cache("test_key", {"foo": "bar"})
    result = _get_cache("test_key", 60)
    assert result == {"foo": "bar"}

def test_cache_expired_returns_none():
    _set_cache("expired_key", "data")
    _cache["expired_key"] = ("data", 0)  # force old timestamp
    assert _get_cache("expired_key", 60) is None


# ── parse_rss_entry tests ──────────────────────────────────────────────────────

def test_parse_rss_entry_basic():
    entry = MagicMock()
    entry.get = lambda k, default="": {
        "title": "Test Title",
        "summary": "Test summary",
        "link": "https://example.com/article",
        "author": "ET Bureau",
        "published": "Mon, 01 Jan 2025 10:00:00 +0000",
    }.get(k, default)
    entry.media_content = []
    entry.media_thumbnail = []
    entry.enclosures = []

    result = _parse_rss_entry(entry, "tech", 0)
    assert result["title"] == "Test Title"
    assert result["category"] == "Tech"
    assert result["author"] == "ET Bureau"
    assert result["tags"] == ["tech"]
    assert isinstance(result["id"], int)

def test_parse_rss_entry_truncates_long_summary():
    long_text = "word " * 200
    entry = MagicMock()
    entry.get = lambda k, default="": {
        "title": "Title",
        "summary": long_text,
        "link": "https://example.com/x",
    }.get(k, default)
    entry.media_content = []
    entry.media_thumbnail = []
    entry.enclosures = []

    result = _parse_rss_entry(entry, "top", 0)
    assert len(result["summary"]) <= 403  # 400 + "..."
    assert result["summary"].endswith("...")


# ── API endpoint tests ─────────────────────────────────────────────────────────

def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_categories_returns_list():
    r = client.get("/api/categories")
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 6

def test_categories_have_required_fields():
    r = client.get("/api/categories")
    for cat in r.json():
        assert "slug" in cat
        assert "name" in cat
        assert "color" in cat

def test_articles_returns_list():
    with patch("main._fetch_live_articles", return_value=[
        {"id": 1, "title": "T", "category": "Tech", "summary": "", "content": "",
         "imageUrl": "", "author": "A", "publishedAt": "", "readTime": 2, "link": "", "tags": []}
    ]):
        r = client.get("/api/articles")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

def test_articles_category_filter_fallback():
    static_articles = [
        {"id": 1, "category": "Tech", "title": "T1"},
        {"id": 2, "category": "Markets", "title": "T2"},
    ]
    with patch("main._fetch_live_articles", return_value=[]):
        with patch("main._load_json", return_value=static_articles):
            r = client.get("/api/articles?category=tech")
            data = r.json()
            assert all(a["category"].lower() == "tech" for a in data)

def test_article_by_id_not_found():
    with patch("main._load_json", return_value=[]):
        r = client.get("/api/articles/99999")
        assert "error" in r.json()

def test_market_data_returns_list():
    mock_data = [{"id": "sensex", "name": "SENSEX", "value": 75000,
                  "change": 100, "changePercent": 0.13, "trend": "up"}]
    with patch("main._fetch_live_market_data", return_value=mock_data):
        r = client.get("/api/market-data")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert r.json()[0]["id"] == "sensex"

def test_story_arcs_returns_list():
    with patch("main._fetch_live_articles", return_value=[]):
        r = client.get("/api/story-arc")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

def test_story_arc_not_found():
    with patch("main._fetch_live_articles", return_value=[]):
        r = client.get("/api/story-arc/nonexistent-slug")
        assert "error" in r.json()
