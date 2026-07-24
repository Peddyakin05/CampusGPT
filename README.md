# CampusGPT

An AI-powered student hub built for **any** Nigerian university — not tied to one school. Built for the Build with Gemma: GDGoc LASU hackathon.

CampusGPT solves four recurring campus problems: calculating GPA on the Nigerian 5.0 scale, finding buildings/venues on campus, tracking exam timelines (especially the fast-changing departmental exams students often miss), and giving students a natural-language chat interface to ask about any of the above — all in one no-build-step web app. The GPA calculator and exam timeline run fully client-side with no network dependency; the chat and AI-phrased directions require a live Gemma API call.

## Live Demo

🔗 **[Live App](https://YOUR_USERNAME.github.io/campusgpt)**
🎥 **[Demo Video](YOUR_YOUTUBE_LINK)**

## How Gemma 4 is used

Gemma 4 (`gemma-4-26b-a4b-it`, via the Google Generative Language API) is the reasoning core of this app — but it is used as a **router**, not a calculator. This is the key architectural decision behind the project:

1. Every chat message is first sent to Gemma with a classification prompt: is this a GPA question, a location question, an exam timeline question, or general chat?
2. If it's GPA, location, or timeline, the message is routed to a **deterministic JavaScript function** that computes the real answer (GPA math, exam countdown logic, venue lookup) from structured data — Gemma never guesses these numbers.
3. Gemma is then given the tool's factual output and asked only to phrase it clearly and conversationally for the student.
4. If it's general chat, Gemma responds directly using conversation history and a system prompt tuned for Nigerian campus context (including Pidgin English understanding).

This means every number a student sees (their GPA, days until an exam) is 100% accurate and never hallucinated, while Gemma still supplies natural, context-aware language and intent understanding — which is the hardest part of the UX to fake with static code.

```
[ Student Chat Interface ] ──► [ Intent Router (Gemma 4) ] ──► [ Google Generative Language API ]
                                          │
                ┌─────────────────────────┼──────────────────────────┐
                ▼                         ▼                          ▼
      [ GPA Calculator ]         [ Location Lookup ]          [ Exam Timeline ]
        Deterministic JS          Seeded JSON per Uni          localStorage + Seed
                └─────────────────────────┴──────────────────────────┘
                                          ▼
                       [ Structured Result → Gemma → Natural Language ]
                       Model only phrases results; never computes them
```

## Multi-University Support

Unlike a single-campus tool, CampusGPT ships with a university picker (10 Nigerian universities seeded: LASU, UNILAG, OAU, UI, ABU, Covenant, UNN, FUTA, Babcock, UNIPORT). Selecting a university scopes all data — venues, departments, exam schedules, and branding colors — to that school. All universities use the same JSON schema (`universities.json`), so adding a new school is just adding a new entry.

## Features

- **GPA Calculator** — Nigerian 5.0 CGPA scale, per-course breakdown, semester history, CGPA trend chart.
- **Campus Map** — searchable venue directory with step-by-step walking directions, phrased by Gemma.
- **Exam Timeline** — GNS vs Departmental exam tracking with urgency color-coding; a "Class Rep" form lets students post/update exam info (simulating the crowdsourced notice-board system, stored via localStorage for this prototype).
- **Chat** — natural language front door to all of the above, with visible tool-routing tags so you can see which system handled each answer.

## 🔍 Where to find Gemma in the code

All Gemma 4 API calls live in `index.html` and are marked with `[GEMMA CALL #...]` banner comments — search the file for `GEMMA CALL` to jump straight to each one:

| Call | Function | Purpose |
|---|---|---|
| **#1 — Intent Router** | `classifyIntent()` | Reads the student's raw message and classifies it as GPA / LOCATION / TIMELINE / CHAT. This decision is what routes to a deterministic tool or to free conversation. |
| **#2 — Result Phrasing** | `gemmaReply()` | Takes a tool's plain-text result (GPA number, location match, exam dates) and asks Gemma to phrase it naturally — the system instruction explicitly tells it not to recalculate. |
| **#3 — Free Conversation** | `gemmaConversation()` | Handles general questions with full multi-turn chat history when no tool applies. |

All three calls hit the same endpoint, defined once near the top of the script:
```javascript
const GEMMA_MODEL = "gemma-4-26b-a4b-it";
const GEMMA_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMMA_MODEL}:generateContent?key=${GOOGLE_API_KEY}`;
```

The deterministic (non-Gemma) tool logic sits in the same file in `handleGPAQuery()`, `handleLocationQuery()`, and `handleTimelineQuery()` — these never call Gemma and always return plain computed strings, which is exactly what gets fed into Gemma Call #2 for phrasing.

## Running locally

Because the app fetches `universities.json`, it must be served over HTTP (not opened directly as a `file://` path, which browsers block via CORS). Make sure you've created `config.js` (see Setup below) before testing, or Gemma calls will silently no-op.

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Setup — API key

This is a static HTML/JS app with no build step, so a traditional `.env` file won't work here (browsers can't read `.env` — that mechanism only applies to server-side processes). Instead, the key lives in a small gitignored `config.js` file:

1. Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Copy `config.example.js` to a new file named `config.js`:
   ```bash
   cp config.example.js config.js
   ```
3. Open `config.js` and paste your key in place of `YOUR_API_KEY_HERE`.
4. `config.js` is listed in `.gitignore`, so it will never be committed or pushed to GitHub — only `config.example.js` (the template, with no real key) is tracked.

## Deploying online with AI replies

Use Vercel for the live demo. This repo includes `api/gemini.js`, a serverless proxy that reads the API key from a private environment variable and calls Gemma from the server. The browser never receives the key.

1. Push the repo to GitHub.
2. Import the repo at [vercel.com](https://vercel.com).
3. In the Vercel project settings, add an environment variable:
   - Name: `GOOGLE_API_KEY`
   - Value: your Google AI Studio key
4. Redeploy the Vercel project.
5. Open the Vercel URL and ask a question in chat.

GitHub Pages can still host the static interface, but it cannot securely run Gemma calls because it has no backend or private environment variables. For a working public AI demo, use the Vercel URL.

## Tech stack

Plain HTML/CSS/JS — no build step, no framework, no backend. Data is seeded JSON (`universities.json`) plus `localStorage` for crowdsourced additions (exam updates, semester history). The GPA calculator and exam timeline logic run entirely on-device with no network call at all; the chat interface and AI-phrased campus directions require connectivity, since that's where Gemma's reasoning happens.

## Known limitations / how this would scale

- The API key is loaded client-side via `config.js` only for local testing. Online Gemma calls go through the Vercel serverless proxy in `api/gemini.js`, with the key stored as a private `GOOGLE_API_KEY` environment variable.
- Crowdsourced data (exam updates) is stored in browser localStorage rather than a shared database; production would use Firebase or Supabase so updates sync across all students, not just the browser that posted them.
- Location data is seeded manually; production would add photo-to-text OCR so class reps can snap a photo of a physical notice board and have it parsed automatically.
