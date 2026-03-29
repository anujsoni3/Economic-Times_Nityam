# Economic Times — GenAI Hackathon Platform

> A full-stack AI-powered news platform built on top of The Economic Times, featuring live market data, multilingual support, LangGraph-based personalization, and Groq-powered AI briefings.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [AI Features Deep Dive](#ai-features-deep-dive)
- [Multilingual Support](#multilingual-support)
- [Screenshots](#screenshots)

---

## Overview

This platform reimagines The Economic Times as an AI-native news experience. It pulls **live articles from ET RSS feeds**, fetches **real-time market data via Yahoo Finance**, and layers four distinct AI-powered features on top:

| Feature | Description |
|---|---|
| **News Navigator** | Enter any topic → get a structured AI briefing → ask follow-up Q&A |
| **Story Arc** | Track ongoing business stories with timelines, sentiment, key players & watchlists |
| **My ET** | LangGraph multi-agent personalized news feed based on your interests |
| **Vernacular Engine** | Culturally-adapted translation into Hindi, Tamil, and Telugu |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  Vite + React 19 + React Router v7 + Bootstrap Icons │
└────────────────────┬────────────────────────────────┘
                     │ REST + SSE
┌────────────────────▼────────────────────────────────┐
│               FastAPI Backend (Python)               │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  ET RSS Feed │  │  yfinance    │  │  Groq API │  │
│  │  (7 feeds)   │  │  (7 symbols) │  │  Llama 3.3│  │
│  └──────────────┘  └──────────────┘  └───────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │         LangGraph Multi-Agent (My ET)         │    │
│  │  Fetch Agent → Filter Agent → Format Agent   │    │
│  └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## Features

### 1. Live News Feed
- Pulls from 7 ET RSS categories: Top Stories, Markets, Industry, Tech, Wealth, Economy, Politics
- Parallel fetching with `ThreadPoolExecutor` (7 workers)
- In-memory cache (5 min TTL for articles, 1 min for market data)
- Stable article IDs derived from MD5 hash of article URL
- Automatic image extraction from ET article `msid` in URL

### 2. Live Market Widget
- Real-time data for SENSEX, NIFTY 50, BANK NIFTY, GOLD, SILVER, CRUDE OIL, USD/INR
- Powered by `yfinance` — no API key required
- Fallback to static JSON if Yahoo Finance is unavailable

### 3. News Navigator (AI Briefing + Q&A)
- User enters any topic (e.g. "RBI Rate Cut", "Budget 2025")
- Backend fetches and scores relevant articles using token + phrase matching
- Groq (Llama 3.3 70B) synthesizes a structured briefing: What Happened / Key Players / Impact / What's Next
- Follow-up Q&A strictly grounded in the generated briefing
- Full fallback if Groq API is unavailable

### 4. Story Arc Tracker
- Groups live articles into ongoing story clusters using keyword matching
- Four visualization templates:
  - **Timeline** — chronological article progression
  - **Sentiment** — positive/negative/neutral scoring per article
  - **Key Players** — named entity detection for known Indian business figures
  - **Watch Next** — curated watchlist of upcoming events per story

### 5. My ET — Personalized Newsroom
- LangGraph 3-node pipeline: `fetch_node → filter_node → format_node`
- Groq structured output (`FilterList`) for intelligent article relevance scoring
- Lexical fallback filter if LLM fails
- Real-time SSE streaming of agent logs to a terminal UI in the browser
- Supports all 4 languages for regional article fetching

### 6. Vernacular Engine
- Full article translation + cultural adaptation into Hindi, Tamil, Telugu
- Uses Groq Llama 3.3 70B with language-specific cultural prompts
- Returns: translated title, summary, content, regional context, glossary (3–5 terms), adaptation notes
- Batch translation endpoint for translating entire news feeds at once
- 10-minute cache per article+language combination

---

## Tech Stack

### Frontend
| Tool | Version | Purpose |
|---|---|---|
| React | 19.x | UI framework |
| Vite | 5.x | Build tool & dev server |
| React Router | v7 | Client-side routing |
| Bootstrap Icons | 1.13 | Icon library |
| Vitest | 4.x | Unit testing |

### Backend
| Tool | Purpose |
|---|---|
| FastAPI | REST API framework |
| Uvicorn | ASGI server |
| feedparser | ET RSS feed parsing |
| yfinance | Live market data |
| Groq SDK | LLM inference (Llama 3.3 70B) |
| LangGraph | Multi-agent orchestration |
| LangChain-Groq | LangGraph ↔ Groq integration |
| sse-starlette | Server-Sent Events for My ET streaming |
| python-dotenv | Environment variable management |

---

## Project Structure

```
et-base/
├── backend/
│   ├── main.py              # FastAPI app — all endpoints
│   ├── my_et_agent.py       # LangGraph agent (Fetch → Filter → Format)
│   ├── requirements.txt     # Python dependencies
│   └── data/
│       ├── articles.json    # Static fallback articles
│       └── market_data.json # Static fallback market data
├── src/
│   ├── api.js               # All frontend API calls
│   ├── App.jsx              # Router + route definitions
│   ├── context/
│   │   └── LanguageContext.jsx  # Global language state + i18n strings
│   ├── components/
│   │   ├── ArticleCard/         # Article preview card
│   │   ├── ArticleTranslateBar/ # Language switcher on article page
│   │   ├── FeatureSlot/         # AI feature entry point cards
│   │   ├── Footer/              # Site footer
│   │   ├── GlossaryTooltip/     # Hover tooltip for translated terms
│   │   ├── HeroSection/         # Homepage hero with featured article
│   │   ├── LanguageSwitcher/    # Global language toggle in navbar
│   │   ├── MarketWidget/        # Live market ticker
│   │   ├── Navbar/              # Top navigation bar
│   │   ├── NewsFeed/            # Article grid
│   │   └── RegionalContext/     # Regional impact panel on article page
│   ├── layouts/
│   │   └── MainLayout.jsx       # Shared layout wrapper
│   └── pages/
│       ├── Home/                # Homepage
│       ├── Article/             # Single article view with translation
│       ├── Category/            # Category filtered feed
│       ├── StoryArc/            # Story Arc tracker + 4 templates
│       ├── NewsNavigator/       # AI briefing + Q&A
│       ├── MyET/                # Personalized newsroom
│       ├── NewsNavigator/       # AI briefing + Q&A
│       └── Placeholder/         # Placeholder routes for future features
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── index.html
├── package.json
├── vite.config.js
├── tsconfig.json
└── .env                     # GROQ_API_KEY (not committed)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- A [Groq API key](https://console.groq.com) (free tier available)

### 1. Clone the repository
```bash
git clone https://github.com/anujsoni3/Economic-Times_Nityam.git
cd Economic-Times_Nityam
```

### 2. Backend setup
```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the project root:
```
GROQ_API_KEY=your_groq_api_key_here
```

Start the backend:
```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend setup
```bash
# From project root
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Run tests
```bash
# Frontend tests
npm test

# Backend tests
cd backend && python -m pytest test_main.py
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes (for AI features) | Groq API key for Llama 3.3 70B inference |

> Without `GROQ_API_KEY`, the app still works — News Navigator and My ET fall back to deterministic/lexical responses, and the Vernacular Engine returns a 500 error.

---

## API Reference

### Articles
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/articles` | All articles. Query: `?category=markets&lang=hi` |
| GET | `/api/articles/{id}` | Single article by ID |
| GET | `/api/categories` | List of all categories |

### Market Data
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/market-data` | Live SENSEX, NIFTY, GOLD, etc. |

### Story Arc
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/story-arc` | All detected story arcs (min 2 articles) |
| GET | `/api/story-arc/{slug}` | Single story arc by slug |

### News Navigator
| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/news-navigator` | `{ topic, language }` | Generate AI briefing |
| POST | `/api/news-navigator/ask` | `{ question, briefing, sources, articles }` | Follow-up Q&A |

### Vernacular Engine
| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/translate` | `{ title, summary, content, target_language }` | Translate single article |
| POST | `/api/translate-batch` | `{ articles, target_language }` | Batch translate up to 60 articles |
| GET | `/api/ui-translations` | — | UI string translations. Query: `?lang=hi` |

### My ET
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/my-et/stream` | SSE stream. Query: `?interests=AI,EV&lang=en` |

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Service health + data source status |

---

## AI Features Deep Dive

### News Navigator Flow
```
User Input (topic)
      ↓
_fetch_live_articles() — pulls all RSS feeds
      ↓
_score_article_for_topic() — token + phrase relevance scoring
      ↓
call_claude_briefing() → Groq Llama 3.3 70B
      ↓
Structured JSON: { what_happened, key_players, impact, whats_next, sources }
      ↓
User asks follow-up → call_claude_qa() → grounded answer + citations
```

### My ET LangGraph Pipeline
```
Initial State: { interests, language, raw_articles }
      ↓
[fetch_node]  — logs article count, passes state
      ↓
[filter_node] — Groq structured output (FilterList) scores each article
             — Lexical fallback if LLM fails
      ↓
[format_node] — finalizes feed, emits SSE "complete" event
      ↓
Final State: { final_feed: [...articles with match_reason] }
```

### Vernacular Engine Prompt Strategy
Each language has a dedicated `LANG_CONFIG` entry with:
- Script name (Devanagari / Tamil / Telugu)
- Target region description
- Cultural notes (local markets, schemes, idioms, reference points)

The prompt instructs the model to:
1. Culturally adapt (not literally translate)
2. Keep brand names and numbers in English
3. Add a `regional_context` field with local impact not in the original article
4. Generate a `glossary` of 3–5 financial terms with simple explanations

---

## Multilingual Support

The app supports 4 languages end-to-end:

| Code | Language | Script | Regional RSS Source |
|---|---|---|---|
| `en` | English | Latin | ET RSS Feeds |
| `hi` | Hindi | Devanagari | Google News RSS (Hindi) |
| `ta` | Tamil | Tamil | Google News RSS (Tamil) |
| `te` | Telugu | Telugu | Google News RSS (Telugu) |

Language switching is global via `LanguageContext` — it affects:
- Article fetching (switches RSS source)
- UI strings (all labels, buttons, placeholders)
- My ET personalization (fetches regional articles)
- Article translation (Vernacular Engine)

---
