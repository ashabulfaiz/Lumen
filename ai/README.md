# LUMEN AI Services

Python microservices that power the LUMEN learning app:

- **Chat (Groq)** — tutor chatbot and Groq-based grammar correction.
- **Grammar + Essay (TensorFlow)** — sentence acceptability / writing-level scoring, plus essay prompts and rubric grading (the essay routes are mounted on the same FastAPI app).

| Service | Default port | Folder | Stack |
|---------|--------------|--------|-------|
| Chat | `5001` | `ai/chat/` | Flask + Groq |
| Grammar + Essay API | `5003` | `ai/grammar/` (+ `ai/essay/`) | FastAPI + TensorFlow |
| Data Science (separate) | `5002` | `../ds-service/` | Flask (documented separately) |

The React/Vite frontend and the Node API talk to these services at the ports above (configurable via the project‑root `.env` — see [Environment variables](#environment-variables)).

---

## Prerequisites

- **Python 3.10–3.12** (TensorFlow 2.16–2.19 does not support 3.13+ yet) and `pip`.
- A **Groq API key** for the chat service (free at <https://console.groq.com>).
- *(Optional)* **bash** to use `start.sh` (preinstalled on macOS/Linux; on Windows use Git Bash/WSL, or follow the manual run steps which work everywhere).

Check your Python version:

```bash
python3 --version   # macOS / Linux
```
```powershell
py -3 --version      # Windows (PowerShell)
```

> Throughout this guide, run commands from the repository root unless a `cd` is shown. Windows examples use **PowerShell**.

---

## 1. Setup

Each service uses its own virtual environment (`.venv`) inside its folder.

### Chat service (`ai/chat`)

**macOS / Linux**
```bash
cd ai/chat
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then edit .env and set GROQ_API_KEY
```

**Windows (PowerShell)**
```powershell
cd ai\chat
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env    # then edit .env and set GROQ_API_KEY
```

### Grammar + Essay service (`ai/grammar`)

**macOS / Linux**
```bash
cd ai/grammar
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**Windows (PowerShell)**
```powershell
cd ai\grammar
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

The trained model under `ai/grammar/models/` is **git-ignored** (not pushed), so train it once before the first run — the training data is included in the repo. See [Training the grammar model](#training-the-grammar-model); the dataset format is documented in [`grammar/data/README.md`](grammar/data/README.md).

**Optional — semantic essay relevance.** Essay grading scores relevance with a sentence-embedding model when [`sentence-transformers`](https://www.sbert.net/) is installed (it is listed in `requirements.txt`). The first grade call downloads a small model (~90 MB) once. If the package or model is unavailable (e.g. offline), grading automatically falls back to keyword-overlap scoring — nothing breaks.

---

## 2. Running the services

### Option A — `start.sh` (macOS / Linux)

Runs both services together; `Ctrl+C` stops both.

```bash
cd ai
./start.sh
```

Override ports inline:

```bash
CHAT_PORT=5001 GRAMMAR_PORT=5003 ./start.sh
```

### Option B — manual (works on every OS)

Use two terminals. This is the recommended path on **Windows** (`start.sh` requires bash).

**Terminal 1 — Grammar + Essay (port 5003)**

```bash
# macOS / Linux
cd ai/grammar && source .venv/bin/activate
uvicorn api.main:app --host 0.0.0.0 --port 5003
```
```powershell
# Windows (PowerShell)
cd ai\grammar; .\.venv\Scripts\Activate.ps1
uvicorn api.main:app --host 0.0.0.0 --port 5003
```

**Terminal 2 — Chat (port 5001)**

```bash
# macOS / Linux
cd ai/chat && source .venv/bin/activate
python app.py
```
```powershell
# Windows (PowerShell)
cd ai\chat; .\.venv\Scripts\Activate.ps1
python app.py
```

To run the grammar service on a different port, change the `--port` value (and update `VITE_GRAMMAR_API_URL` in the root `.env`). The chat app listens on `5001` by default.

Verify the grammar service is up:

```bash
curl http://localhost:5003/health
```
```powershell
Invoke-RestMethod http://localhost:5003/health
```

---

## Environment variables

**`ai/chat/.env`**

```env
GROQ_API_KEY=your_groq_api_key
```

**Project root `Lumen/.env`** (shared by the Node API and Vite frontend)

```env
AI_CHAT_URL=http://127.0.0.1:5001
VITE_AI_CHAT_URL=http://localhost:5001
VITE_GRAMMAR_API_URL=http://localhost:5003
```

> Use each service's own `.venv` for grammar/essay (not a mismatched `conda base` Keras). If a `.keras` model fails to load, reinstall requirements in that venv or retrain there — see [Troubleshooting](#troubleshooting).

---

## Chat API (`ai/chat`)

Flask app powered by **Groq** (`llama-3.3-70b-versatile`).

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chat` | Tutor chatbot. Body: `message`, optional `language` (`en` \| `id`). |
| `POST` | `/api/ai/correct` | Grammar correction JSON (used by the Node `/api/grammar/check`). Body: `text`. |
| `POST` | `/api/check-semantic` | Health / placeholder semantic check. |

**Example**

```bash
# macOS / Linux
curl -X POST http://localhost:5001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Explain present perfect","language":"en"}'
```
```powershell
# Windows (PowerShell)
Invoke-RestMethod -Uri http://localhost:5001/api/chat -Method Post `
  -ContentType 'application/json' `
  -Body '{"message":"Explain present perfect","language":"en"}'
```

---

## Grammar API (`ai/grammar`)

FastAPI service: acceptability scoring, corrections, writing level, and writing tips. Built with the **TensorFlow Functional API** (no pretrained LLM).

### ML layout

| Component | Location |
|-----------|----------|
| Model (Functional API + custom layers) | `src/model.py`, `src/custom_layers.py` |
| Custom loss | `src/custom_losses.py` |
| Custom callbacks | `src/custom_callbacks.py` |
| Training (`tf.GradientTape`) | `src/train.py` |
| TensorBoard logs | `reports/tensorboard/<timestamp>/` |
| Production export | `models/grammar_acceptability.keras`, `models/saved_model/` |
| Offline evaluation | `src/evaluate.py` → `reports/evaluation_metrics.json`, `evaluation_summary.txt` |
| CLI inference | `predict.py`, `src/inference.py` |
| REST API | `api/main.py` |

**Quality bar (offline only):** accuracy ≥ 85%, MAE ≤ 0.02 — stored under `reports/`, never sent to the frontend.

### Training the grammar model

Place cleaned CSVs under `grammar/data/cola/` and `grammar/data/jfleg/` first (format: [`grammar/data/README.md`](grammar/data/README.md)). When `train.csv` exists in both folders, training uses them directly.

**macOS / Linux**
```bash
cd ai/grammar && source .venv/bin/activate
bash scripts/run_pipeline.sh
# or run the steps directly:
python -m src.train
python -m src.evaluate
```

**Windows (PowerShell)** — `run_pipeline.sh` is bash-only, so run the steps directly:
```powershell
cd ai\grammar; .\.venv\Scripts\Activate.ps1
python -m src.train
python -m src.evaluate
```

Inspect training in TensorBoard (any OS):

```bash
tensorboard --logdir reports/tensorboard
```

### HTTP endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Model load status |
| `POST` | `/check-grammar` | Lesson assist / grade. Body: `sentence`, `mode` (`grade` \| `assist`). |
| `POST` | `/check-writing` | Full checker + tips |
| `POST` | `/score` | Score + level (no tips) |
| `POST` | `/predict` | Raw acceptability score |

`grade` responses include `score_percent`, `writing_level`, corrections, and errors.

**Example**

```bash
# macOS / Linux
curl -X POST http://localhost:5003/check-grammar \
  -H "Content-Type: application/json" \
  -d '{"sentence":"She go to school.","mode":"grade"}'
```
```powershell
# Windows (PowerShell)
Invoke-RestMethod -Uri http://localhost:5003/check-grammar -Method Post `
  -ContentType 'application/json' `
  -Body '{"sentence":"She go to school.","mode":"grade"}'
```

### CLI

```bash
# macOS / Linux
cd ai/grammar && source .venv/bin/activate
python predict.py "They have been studying English for two years."
```
```powershell
# Windows (PowerShell)
cd ai\grammar; .\.venv\Scripts\Activate.ps1
python predict.py "They have been studying English for two years."
```

---

## Essay API (`ai/essay`)

The essay routes are mounted on the grammar FastAPI app, so they run on the **same service (port 5003)**.

**Data:** `essay/data/essay_questions.json`, `essay_rubric.json`, `course_mapping.json`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/essay/question` | Random prompt per course (`level`, `course_order`, optional `seed`) |
| `GET` | `/essay/rubric` | Rubric weights and scoring bands |
| `POST` | `/essay/grade` | Scores grammar, vocabulary, relevance, coherence |

Grading combines the TensorFlow grammar score with a rubric. **Relevance** uses semantic similarity when `sentence-transformers` is installed, falling back to keyword overlap otherwise (see the setup note above).

Frontend client: `src/lib/essayApi.js`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Activate.ps1 cannot be loaded ... running scripts is disabled` (Windows) | Allow scripts for the current session: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`, then re-run the activate command. |
| `curl` behaves oddly on Windows | In PowerShell `curl` is an alias for `Invoke-WebRequest`. Use the `Invoke-RestMethod` examples, or call `curl.exe` explicitly. |
| `quantization_config` / Keras error on model load | `pip install -U "tensorflow>=2.16,<2.20"` inside `ai/grammar/.venv`, or retrain in that venv. |
| `Model not trained` on `/health` | Run `python -m src.train` in `ai/grammar`. |
| Groq errors / empty replies | Check `GROQ_API_KEY` in `ai/chat/.env`. |
| Port already in use | macOS/Linux: `CHAT_PORT=... GRAMMAR_PORT=... ./start.sh`. Any OS: change the `--port` on the manual `uvicorn` command. |
| Essay relevance not semantic | Install `sentence-transformers` in `ai/grammar/.venv` and restart the service; the first call downloads the model. |
