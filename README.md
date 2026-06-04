# LUMEN

LUMEN is an English‑learning web app. Learners take a one‑time **placement test**, get placed at a level (Beginner / Intermediate / Advanced), then work through modules of **quizzes** and **AI‑graded writing**. Completing a level unlocks the next one and earns a **certificate**. A built‑in **AI tutor chatbot** and **grammar checker** support learning along the way.

## Architecture

The app is split into a React frontend and several backend services:

| Component | Tech | Default port | Folder | Responsibility |
|-----------|------|--------------|--------|----------------|
| Frontend | React + Vite + Tailwind | `5173` | `./` (`src/`) | UI for learning, quizzes, writing, progress, certificates |
| API server | Node.js + Express + MySQL | `5000` | `server/` | Auth, curriculum, progress, placement, certificates |
| Data Science service | Python + Flask | `5002` | `ds-service/` | Analytics, level recommendation, quiz datasets |
| AI service | Python + FastAPI + TensorFlow + Groq | `5003` | `ai/grammar/` (+ `ai/essay/`) | Grammar scoring + essay rubric grading + tutor chatbot |
| Database | MySQL | `3306` | — | Persistent data (schema `lumen`) |

How they connect: the **frontend** calls the **API server** (5000) and the **AI service** (5003, for grammar/essay grading). The **API server** calls the **AI service** (5003, for the chatbot + Groq grammar correction) and the **DS service** (5002, for learning analytics).

> **Merged AI service** — the tutor chatbot + Groq grammar correction (formerly a separate `ai/chat` Flask service on 5001) are now part of the FastAPI **AI service** on 5003. There is a single AI service to deploy.

> **What each service enables** — Core learning + progress works with MySQL + API server + frontend. Writing/essay grading + the chatbot need the **AI service (5003)** (+ a Groq API key for chat/correction). Learning analytics on the Progress page need the **DS service (5002)**.

## Prerequisites

- **Node.js 18+** and npm
- **Python 3.10–3.12** and pip (for the AI and DS services)
- **MySQL 8+** running locally

## Quick start

Run the steps from the repository root (`Lumen/`) unless noted. Commands are identical across OS except where **macOS/Linux** and **Windows (PowerShell)** blocks are shown.

### 1. Configure environment files

Copy each example file and fill in real values.

**macOS / Linux**
```bash
cp .env.example .env
cp ds-service/.env.example ds-service/.env
cp ai/grammar/.env.example ai/grammar/.env
```
**Windows (PowerShell)**
```powershell
Copy-Item .env.example .env
Copy-Item ds-service\.env.example ds-service\.env
Copy-Item ai\grammar\.env.example ai\grammar\.env
```

Set at least `DB_PASSWORD` (if your MySQL root has one), a strong `JWT_SECRET`, and `GROQ_API_KEY` for chat. See [Environment variables](#environment-variables).

### 2. Database + API server (`server/`)

```bash
cd server
npm install
npm run setup-db   # ⚠️ DROPS and recreates the `lumen` database, then creates tables
npm start          # serves on http://localhost:5000 and auto-seeds curriculum + placement questions
```

> `setup-db` is destructive — it drops the existing `lumen` schema. Run it only on first setup or to reset. `npm start` seeds the curriculum automatically on boot.

### 3. Data Science service (`ds-service/`) — needed for module quizzes

**macOS / Linux**
```bash
cd ds-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py        # http://localhost:5002
```
**Windows (PowerShell)**
```powershell
cd ds-service
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py        # http://localhost:5002
```

### 4. AI service (`ai/grammar/`) — grammar checker, essay grading, chatbot

The chatbot + Groq grammar correction are merged into the FastAPI grammar/essay API, so there is **one** AI service to run on port `5003`:

**macOS / Linux**
```bash
cd ai/grammar
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --host 0.0.0.0 --port 5003
# or, from ai/: ./start.sh
```
**Windows (PowerShell)**
```powershell
cd ai\grammar
py -3 -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn api.main:app --host 0.0.0.0 --port 5003
```

Full instructions (setup, training, endpoints, troubleshooting) are in **[`ai/README.md`](ai/README.md)**.

### 5. Frontend (repository root)

```bash
npm install
npm run dev          # http://localhost:5173
```

Open <http://localhost:5173> and register an account.

## Environment variables

Never commit real `.env` files — only the `.env.example` templates are tracked. Copy them as shown in step 1.

**Root `.env`** (API server + Vite frontend) — see [`.env.example`](.env.example)

```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=lumen
JWT_SECRET=change_me_to_a_long_random_secret
# Internal services the API server calls (no trailing slash):
AI_SERVICE_URL=http://localhost:5003
DS_SERVICE_URL=http://localhost:5002
# Frontend (Vite) — set at build time:
VITE_API_URL=http://localhost:5000/api
VITE_GRAMMAR_API_URL=http://localhost:5003
```

**`ds-service/.env`** — see [`ds-service/.env.example`](ds-service/.env.example) (same DB credentials + `DS_PORT=5002`)

**`ai/grammar/.env`** — see [`ai/grammar/.env.example`](ai/grammar/.env.example) (`GROQ_API_KEY` for the chatbot + Groq grammar correction)

## Available scripts

**Frontend (root)**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server (HMR) on `5173` |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

**API server (`server/`)**

| Command | Description |
|---------|-------------|
| `npm start` | Start the Express API on `5000` (auto-seeds curriculum) |
| `npm run setup-db` | Drop + recreate the database and tables |
| `npm run seed` | Re-run the curriculum + placement seeders |

## Project structure

```
Lumen/
├── src/                # React frontend (pages, components, lib, data)
├── server/             # Node.js + Express API (MySQL)
│   └── src/            # controllers, models, routes, config (incl. DB seed)
├── ds-service/         # Flask data-science service (quizzes, analytics)
├── ai/
│   ├── grammar/        # FastAPI AI service: TensorFlow grammar + Groq chatbot/correction
│   └── essay/          # Essay prompts + rubric grading (mounted on the AI service)
├── .env.example        # Frontend + API env template
└── README.md
```

## How the learning flow works

1. **Placement test** (15 questions, taken once) sets your starting level.
2. **Choose Your Level** — you can study any level up to your placement result.
3. Each module has a **quiz** (pass ≥ 70%) and a **writing task** graded by AI (grammar ≥ 60%). Both must pass to complete the module.
4. Completing **all modules** of your current top level **unlocks the next level**.
5. Completing every module in a level makes its **certificate** claimable.

## Deployment (Railway + Vercel)

Deploy the three backend services on **Railway** and the frontend on **Vercel**. Each Railway service has a `Procfile` and sets its own **Root Directory**.

> ⚠️ **Secrets**: `.env` files are **not** committed. Set every value below in the Railway/Vercel dashboards. Rotate the DB password, `JWT_SECRET`, and `GROQ_API_KEY` if they were ever committed.

| Service (Railway) | Root Directory | Start (from `Procfile`) | Env vars to set |
|---|---|---|---|
| API server | `server` | `node server.js` | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `AI_SERVICE_URL`, `DS_SERVICE_URL` |
| AI service | `ai` | `cd grammar && uvicorn api.main:app --host 0.0.0.0 --port $PORT` | `GROQ_API_KEY` |
| DS service | `ds-service` | `gunicorn app:app --bind 0.0.0.0:$PORT` | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (point to the **same** Railway MySQL) |

> The AI service Root Directory is `ai` (not `ai/grammar`) so that the sibling `ai/essay` folder is included in the build.

**Frontend (Vercel)** — Root Directory `./`, build `npm run build`, output `dist`. Set at build time:

```env
VITE_API_URL=https://<api-server>.up.railway.app/api      # must include /api
VITE_GRAMMAR_API_URL=https://<ai-service>.up.railway.app  # no /api suffix
```

Notes:
- `AI_SERVICE_URL` and `VITE_GRAMMAR_API_URL` both point to the **same** AI service URL.
- The DS service must use the **same** database as the API server (`DB_NAME=railway` on Railway, not `lumen`).
- Run `npm run setup-db` + `npm run seed` once against the Railway DB before first use.
- Railway injects `PORT` automatically; the Procfiles read it.
- The AI service ships a 37 MB TensorFlow model; the first boot is slow and needs ≥1 GB RAM.

## More documentation

- **AI service** (grammar, essay, chatbot): [`ai/README.md`](ai/README.md)
- **Grammar training data** format: [`ai/grammar/data/README.md`](ai/grammar/data/README.md)
