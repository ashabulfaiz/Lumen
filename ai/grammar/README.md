# AI TensorFlow — Grammar & Writing Level

Model **TensorFlow dari awal** (Functional API, tanpa pretrained) untuk skor acceptability grammar, koreksi berbasis JFLEG lokal, dan klasifikasi level tulisan **Beginner / Intermediate / Advanced** untuk aplikasi web.

## Rubrik ML

| Komponen | File |
|----------|------|
| Functional API + custom layer | `src/model.py`, `src/custom_layers.py` |
| Custom loss | `src/custom_losses.py` |
| Custom callback | `src/custom_callbacks.py` |
| Training `tf.GradientTape` | `src/train.py` |
| TensorBoard | `reports/tensorboard/<timestamp>/` |
| Export produksi | `models/grammar_acceptability.keras`, `models/saved_model/` |
| Evaluasi offline | `src/evaluate.py` → `reports/evaluation_metrics.json` |
| Inference | `predict.py`, `src/inference.py` |
| REST API (web) | `api/main.py` — `POST /check-grammar` port **5002** |

**Rubric:** accuracy ≥ 85%, MAE ≤ 0,02 (hanya di `reports/`, tidak dikirim ke frontend).

## Dataset

Letakkan CSV hasil cleaning tim DS di [`data/cola/`](data/cola/) dan [`data/jfleg/`](data/jfleg/) — detail kolom di [`data/README.md`](data/README.md).

Tidak perlu langkah lain: jika `train.csv` sudah ada, training langsung memakai file tersebut.

## Setup & training

```bash
cd ai/grammar
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

bash scripts/run_pipeline.sh
# atau:
python -m src.train && python -m src.evaluate
```

TensorBoard:

```bash
tensorboard --logdir reports/tensorboard
```

## API untuk web

```bash
uvicorn api.main:app --host 0.0.0.0 --port 5002
```

Frontend (Vite) — opsional di `.env` root:

```env
VITE_GRAMMAR_API_URL=http://localhost:5002
```

```bash
# Lesson + checker web
curl -X POST http://localhost:5002/check-grammar \
  -H "Content-Type: application/json" \
  -d '{"sentence":"She go to school.","mode":"grade"}'

```

Response mode `grade` mencakup `score_percent`, `writing_level`, koreksi, dan error — dipakai di lesson review essay.

## Inference CLI

```bash
python predict.py "They have been studying English for two years."
```
