#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

PYTHON="${PYTHON:-python3}"
if [[ -x .venv/bin/python ]]; then
  PYTHON=".venv/bin/python"
fi

if [[ -f data/cola/train.csv && -f data/jfleg/train.csv ]]; then
  echo "==> Dataset found in data/ — using existing CSV files"
else
  echo "==> No train.csv in data/cola or data/jfleg — generating sample data"
  $PYTHON scripts/generate_sample_data.py
fi

echo "==> Training (GradientTape + TensorBoard)"
$PYTHON -m src.train

echo "==> Offline evaluation (reports/ only)"
$PYTHON -m src.evaluate

echo "==> Done. Start API: uvicorn api.main:app --host 0.0.0.0 --port 5002"
