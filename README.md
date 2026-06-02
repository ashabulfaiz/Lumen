# LUMEN

LUMEN is an English‑learning web app. Learners take a one‑time **placement test**, get placed at a level (Beginner / Intermediate / Advanced), then work through modules of **quizzes** and **AI‑graded writing**. Completing a level unlocks the next one and earns a **certificate**. A built‑in **AI tutor chatbot** and **grammar checker** support learning along the way.

## Architecture

The app is split into a React frontend and several backend services:

| Component | Tech | Default port | Folder | Responsibility |
|-----------|------|--------------|--------|----------------|
| Frontend | React + Vite + Tailwind | `5173` | `./` (`src/`) | UI for learning, quizzes, writing, progress, certificates |
| API server | Node.js + Express + MySQL | `5000` | `server/` | Auth, curriculum, progress, placement, certificates |
| Data Science service | Python + Flask | `5002` | `ds-service/` | Quiz question datasets + analytics/recommendations |
| Chat service | Python + Flask + Groq | `5001` | `ai/chat/` | Tutor chatbot + grammar correction |
| Grammar + Essay service | Python + FastAPI + TensorFlow | `5003` | `ai/grammar/` (+ `ai/essay/`) | Grammar scoring + essay rubric grading |
| Database | MySQL | `3306` | — | Persistent data (schema `lumen`) |

How they connect: the **frontend** calls the **API server** (5000) and the **Grammar/Essay service** (5003). The **API server** calls the **DS service** (5002) for module‑quiz questions and the **Chat service** (5001) for grammar correction.

> **What each service enables** — Core learning + progress works with MySQL + API server + frontend. Module quizzes need the **DS service (5002)**. Writing/essay grading needs the **Grammar service (5003)**. The chatbot needs the **Chat service (5001)** + a Groq API key.

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
cp ai/chat/.env.example ai/chat/.env
```
**Windows (PowerShell)**
```powershell
Copy-Item .env.example .env
Copy-Item ds-service\.env.example ds-service\.env
Copy-Item ai\chat\.env.example ai\chat\.env
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

### 4. AI services (`ai/`) — chatbot, grammar checker, essay grading

Full instructions (setup, training, endpoints, troubleshooting) are in **[`ai/README.md`](ai/README.md)**. In short, start the grammar+essay API (5003) and the chat service (5001).

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
# Optional (defaults shown):
VITE_GRAMMAR_API_URL=http://localhost:5003
VITE_AI_CHAT_URL=http://localhost:5001
AI_CHAT_URL=http://127.0.0.1:5001
```

**`ds-service/.env`** — see [`ds-service/.env.example`](ds-service/.env.example) (same DB credentials + `DS_PORT=5002`)

**`ai/chat/.env`** — see [`ai/chat/.env.example`](ai/chat/.env.example) (`GROQ_API_KEY`)

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
│   ├── chat/           # Flask + Groq chatbot / grammar correction
│   ├── grammar/        # FastAPI + TensorFlow grammar model
│   └── essay/          # Essay prompts + rubric grading (mounted on grammar API)
├── .env.example        # Frontend + API env template
└── README.md
```

## How the learning flow works

1. **Placement test** (15 questions, taken once) sets your starting level.
2. **Choose Your Level** — you can study any level up to your placement result.
3. Each module has a **quiz** (pass ≥ 70%) and a **writing task** graded by AI (grammar ≥ 60%). Both must pass to complete the module.
4. Completing **all modules** of your current top level **unlocks the next level**.
5. Completing every module in a level makes its **certificate** claimable.

## More documentation

- **AI services** (chat, grammar, essay): [`ai/README.md`](ai/README.md)
- **Grammar training data** format: [`ai/grammar/data/README.md`](ai/grammar/data/README.md)
