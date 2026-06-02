# LUMEN AI Services

Python microservices for the LUMEN learning app: **Groq chat**, **TensorFlow grammar & writing level**, and **essay prompts / rubric grading** (mounted on the grammar API).

| Service | Default port | Folder |
|---------|--------------|--------|
| Chat (Groq) | 5001 | `ai/chat/` |
| Grammar + Essay API (TensorFlow) | 5003 | `ai/grammar/` (+ `ai/essay/`) |
| Data Science (separate) | 5002 | `../ds-service/` |

---

## Quick start

### 1. Chat (Groq)

```bash
cd ai/chat
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # set GROQ_API_KEY=...
```

### 2. Grammar (TensorFlow)

```bash
cd ai/grammar
python3 -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

If `data/cola/train.csv` and `data/jfleg/train.csv` are missing, generate sample data and train:

```bash
bash scripts/run_pipeline.sh
# or: python -m src.train && python -m src.evaluate
```

### 3. Run both services

```bash
cd ai
./start.sh
```

Override ports if needed:

```bash
CHAT_PORT=5001 GRAMMAR_PORT=5003 ./start.sh
```

---

## Environment variables

**`ai/chat/.env`**

```env
GROQ_API_KEY=your_groq_api_key
```

**Project root `Lumen/.env`** (Node + Vite)

```env
AI_CHAT_URL=http://127.0.0.1:5001
VITE_AI_CHAT_URL=http://localhost:5001
VITE_GRAMMAR_API_URL=http://localhost:5003
```

Use the **project venv** for grammar (not a mismatched `conda base` Keras), or retrain in the same environment if `.keras` load fails.

---

## Chat API (`ai/chat`)

Flask app powered by **Groq** (`llama-3.3-70b-versatile`).

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chat` | Tutor chatbot (`message`, optional `language`: `en` \| `id`) |
| `POST` | `/api/ai/correct` | Grammar correction JSON via Groq (used by Node `/api/grammar/check`) |
| `POST` | `/api/check-semantic` | Health / placeholder semantic check |

Example:

```bash
curl -X POST http://localhost:5001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Explain present perfect","language":"en"}'
```

---

## Grammar API (`ai/grammar`)

FastAPI service: acceptability scoring, corrections, writing level, and writing tips. Built with **TensorFlow Functional API** (no pretrained LLM).

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

**Rubric (offline only):** accuracy ≥ 85%, MAE ≤ 0.02 — stored under `reports/`, not sent to the frontend.

### Dataset

Place cleaned CSVs under `grammar/data/cola/` and `grammar/data/jfleg/`. See [`grammar/data/README.md`](grammar/data/README.md).

When `train.csv` exists in both folders, training uses those files directly.

### Training

```bash
cd ai/grammar
source .venv/bin/activate
bash scripts/run_pipeline.sh
```

TensorBoard:

```bash
tensorboard --logdir reports/tensorboard
```

### Grammar HTTP endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Model load status |
| `POST` | `/check-grammar` | Lesson assist / grade (`mode`: `grade` \| `assist`) |
| `POST` | `/check-writing` | Full checker + tips |
| `POST` | `/score` | Score + level (no tips) |
| `POST` | `/predict` | Raw acceptability score |

Example (lesson / essay review):

```bash
curl -X POST http://localhost:5003/check-grammar \
  -H "Content-Type: application/json" \
  -d '{"sentence":"She go to school.","mode":"grade"}'
```

`grade` responses include `score_percent`, `writing_level`, corrections, and errors.

### CLI

```bash
cd ai/grammar
python predict.py "They have been studying English for two years."
```

---

## Essay API (`ai/essay`)

Routers are included on the grammar FastAPI app (`/essay/*`).

**Data:** `essay/data/essay_questions.json`, `essay_rubric.json`, `course_mapping.json`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/essay/question` | Random prompt per course (`level`, `course_order`, optional `seed`) |
| `GET` | `/essay/rubric` | Weights and scoring bands |
| `POST` | `/essay/grade` | Grammar, vocabulary, relevance, coherence |

Frontend: `src/lib/essayApi.js`

---

## Manual run (without `start.sh`)

```bash
# Terminal 1 — grammar + essay
cd ai/grammar && source .venv/bin/activate
uvicorn api.main:app --host 0.0.0.0 --port 5003

# Terminal 2 — chat
cd ai/chat && source .venv/bin/activate
python app.py
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `quantization_config` on model load | `pip install -U 'tensorflow>=2.16,<2.20'` in `ai/grammar/.venv`, or retrain in that venv |
| `Model not trained` on `/health` | Run `python -m src.train` in `ai/grammar` |
| Groq errors | Check `GROQ_API_KEY` in `ai/chat/.env` |
| Port conflict | Set `CHAT_PORT` / `GRAMMAR_PORT` when running `start.sh` |


# Grammar training data

Place team DS–cleaned CSV files here before training.

## `cola/`

Files: `train.csv`, `val.csv`, `test.csv`

| Column | Type | Description |
|--------|------|-------------|
| `sentence` | string | Input sentence |
| `label` | int | `1` = acceptable, `0` = not acceptable |
| `acceptability_score` | float (optional) | Target score in `[0, 1]`; defaults from `label` if missing |

## `jfleg/`

Files: `train.csv`, `val.csv`, `test.csv`

| Column | Type | Description |
|--------|------|-------------|
| `flawed_sentence` | string | Incorrect sentence |
| `corrected_sentence` | string | Reference correction |
| `acceptability_score_flawed` | float (optional) | Default ~0.1 for flawed rows |
| `acceptability_score_corrected` | float (optional) | Default ~0.95 for corrected rows |

Each JFLEG row expands to two training examples (flawed + corrected).