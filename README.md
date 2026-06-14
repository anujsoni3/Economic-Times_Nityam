# ET GenAI Platform

> An AI-native reimagination of The Economic Times — live RSS feeds, real-time market data, LangGraph personalization, and Groq-powered briefings with multilingual cultural adaptation.

**Live Demo :** [et-genai-platform.vercel.app](https://et-genai-platform.vercel.app/)  

---

## What this is

The ET GenAI Platform layers four AI features on top of live Economic Times data, transforming passive news consumption into an interactive intelligence layer. It ingests 7 ET RSS feeds in parallel, pulls real-time market data via Yahoo Finance, and exposes a FastAPI backend that drives a React 19 frontend over REST and SSE.

---

## Features

### News Navigator — AI briefing + grounded Q&A
Enter any topic ("RBI Rate Cut", "Budget 2025") and receive a structured briefing synthesized by Groq Llama 3.3 70B across live ET articles. The briefing is divided into four sections: what happened, key players, impact, and what's next. Follow-up questions are answered strictly within the context of the generated briefing — no hallucination, full citations.

### Story Arc — ongoing story tracker
Articles are automatically grouped into story clusters using keyword matching, then visualized across four templates: a chronological timeline, a per-article sentiment breakdown, a key-players panel (named Indian business figures), and a watchlist of upcoming related events.

### My ET — LangGraph personalized newsroom
A 3-node LangGraph pipeline (`fetch → filter → format`) scores articles against your declared interests using Groq structured output (`FilterList`). If the LLM call fails, a lexical fallback keeps the feed alive. Agent execution logs stream to a terminal UI in real time over SSE.

### Vernacular Engine — cultural adaptation, not literal translation
Full article translation into Hindi, Tamil, and Telugu using language-specific `LANG_CONFIG` prompts. Each response includes a translated title, summary, body, a `regional_context` field with locally-relevant impact not present in the original, and a glossary of 3–5 financial terms. Brand names and numbers stay in English.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│    Vite + React 19 + React Router v7 + Bootstrap     │
└────────────────────┬────────────────────────────────┘
                     │  REST + SSE
┌────────────────────▼────────────────────────────────┐
│                FastAPI Backend                       │
│                                                      │
│   ET RSS Feeds (7)    yfinance (7 symbols)           │
│   ThreadPoolExecutor  In-memory cache (5 min TTL)    │
│                                                      │
│   ┌──────────────────────────────────────────────┐   │
│   │       LangGraph — My ET Agent Pipeline        │   │
│   │   fetch_node → filter_node → format_node     │   │
│   └──────────────────────────────────────────────┘   │
│                                                      │
│   Groq SDK (Llama 3.3 70B)   LangChain-Groq         │
│   sse-starlette               python-dotenv          │
└─────────────────────────────────────────────────────┘
```

---

## AI Pipeline Details

### News Navigator flow

```
User topic
  → _fetch_live_articles()         # parallel RSS fetch
  → _score_article_for_topic()     # token + phrase relevance scoring
  → Groq Llama 3.3 70B briefing    # structured JSON: what_happened / key_players / impact / whats_next / sources
  → follow-up Q&A                  # grounded against briefing context, with citations
```

### My ET LangGraph pipeline

```
State: { interests, language, raw_articles }
  → [fetch_node]    logs article count, passes state
  → [filter_node]   Groq FilterList structured output; lexical fallback on LLM failure
  → [format_node]   finalizes feed, emits SSE "complete" event
Final: { final_feed: [...articles with match_reason] }
```

### Vernacular Engine prompt strategy

Each language has a dedicated `LANG_CONFIG` with script name, regional description, and cultural reference points (local schemes, idioms, markets). The prompt instructs the model to adapt culturally — not translate literally — while keeping brand names and numbers in English. Responses are cached per `article_id + language` for 10 minutes.

---

## Tech Stack

**Frontend**

| Tool | Version | Role |
|---|---|---|
| React | 19.x | UI framework |
| Vite | 5.x | Build + dev server |
| React Router | v7 | Client-side routing |
| Bootstrap Icons | 1.13 | Icon library |
| Vitest | 4.x | Unit testing |

**Backend**

| Tool | Role |
|---|---|
| FastAPI | REST API + SSE endpoints |
| Uvicorn | ASGI server |
| feedparser | ET RSS parsing |
| yfinance | Live market data (no API key) |
| Groq SDK | LLM inference — Llama 3.3 70B |
| LangGraph | Multi-agent orchestration |
| LangChain-Groq | LangGraph ↔️ Groq integration |
| sse-starlette | Server-Sent Events for My ET streaming |

---

## Multilingual Support

The app supports four languages end-to-end via a global `LanguageContext`. Switching language affects article fetching, UI strings, My ET personalization, and Vernacular Engine translation simultaneously.

| Code | Language | Script | Article source |
|---|---|---|---|
| `en` | English | Latin | ET RSS feeds |
| `hi` | Hindi | Devanagari | Google News RSS (Hindi) |
| `ta` | Tamil | Tamil | Google News RSS (Tamil) |
| `te` | Telugu | Telugu | Google News RSS (Telugu) |

---

## Project Structure

```
et-base/
├── backend/
│   ├── main.py              # FastAPI app — all endpoints
│   ├── my_et_agent.py       # LangGraph agent (fetch → filter → format)
│   ├── requirements.txt
│   └── data/
│       ├── articles.json    # Static fallback articles
│       └── market_data.json # Static fallback market data
├── src/
│   ├── api.js               # All frontend API calls
│   ├── App.jsx              # Router + route definitions
│   ├── context/
│   │   └── LanguageContext.jsx
│   ├── components/
│   │   ├── ArticleCard/
│   │   ├── ArticleTranslateBar/
│   │   ├── FeatureSlot/
│   │   ├── GlossaryTooltip/
│   │   ├── HeroSection/
│   │   ├── LanguageSwitcher/
│   │   ├── MarketWidget/
│   │   ├── Navbar/
│   │   ├── NewsFeed/
│   │   └── RegionalContext/
│   └── pages/
│       ├── Home/
│       ├── Article/
│       ├── Category/
│       ├── StoryArc/
│       ├── NewsNavigator/
│       └── MyET/
├── public/
├── index.html
├── package.json
└── vite.config.js
```

---

## Getting Started

**Prerequisites:** Node.js 18+, Python 3.11+, a [Groq API key](https://console.groq.com) (free tier works).

```bash
# 1. Clone
git clone https://github.com/anujsoni3/Economic-Times_Nityam.git
cd Economic-Times_Nityam

# 2. Backend
cd backend
pip install -r requirements.txt

# 3. Create .env in project root
echo "GROQ_API_KEY=your_key_here" > ../.env

# 4. Start backend
uvicorn main:app --reload --port 8000

# 5. Frontend (new terminal, project root)
npm install
npm run dev
# → http://localhost:5173
```

> Without `GROQ_API_KEY`: News Navigator and My ET fall back to lexical/deterministic responses. The Vernacular Engine returns a 500 error.

---

## Running Tests

```bash
# Frontend
npm test

# Backend
cd backend && python -m pytest test_main.py
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | For AI features | Groq API key — Llama 3.3 70B inference |

---

## API Reference

**Articles**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/articles` | All articles. Query: `?category=markets&lang=hi` |
| `GET` | `/api/articles/{id}` | Single article by ID |
| `GET` | `/api/categories` | List of all categories |

**Market Data**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/market-data` | Live SENSEX, NIFTY 50, BANK NIFTY, GOLD, SILVER, CRUDE OIL, USD/INR |

**Story Arc**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/story-arc` | All detected story arcs (min 2 articles each) |
| `GET` | `/api/story-arc/{slug}` | Single story arc by slug |

**News Navigator**

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/news-navigator` | `{ topic, language }` | Generate structured AI briefing |
| `POST` | `/api/news-navigator/ask` | `{ question, briefing, sources, articles }` | Grounded follow-up Q&A |

**Vernacular Engine**

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/translate` | `{ title, summary, content, target_language }` | Translate single article |
| `POST` | `/api/translate-batch` | `{ articles, target_language }` | Batch translate up to 60 articles |
| `GET` | `/api/ui-translations` | — | UI string translations. Query: `?lang=hi` |

**My ET**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/my-et/stream` | SSE stream. Query: `?interests=AI,EV&lang=en` |

**Health**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health + data source status |

---

## Graceful Degradation

Every AI feature has a defined fallback:

| Feature | Primary | Fallback |
|---|---|---|
| News Navigator | Groq Llama 3.3 70B briefing | Deterministic structured summary |
| My ET filter | Groq `FilterList` structured output | Lexical keyword matching |
| Market data | Yahoo Finance (yfinance) | `data/market_data.json` |
| Articles | ET RSS feeds | `data/articles.json` |
| Vernacular Engine | Groq cultural adaptation | Returns 500 — no partial translation |

---

## Built for

ET GenAI Hackathon — building an AI-native editorial layer on top of The Economic Times.
