#!/usr/bin/env bash
# Run the unified LUMEN AI service: grammar/essay (TensorFlow) + chatbot (Groq).
# Chat was merged into the grammar FastAPI app, so this is now a single service.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/grammar"

PYTHON="${PYTHON:-python3}"
if [[ -x "$ROOT/grammar/.venv/bin/python" ]]; then
  PYTHON="$ROOT/grammar/.venv/bin/python"
fi

PORT="${PORT:-${GRAMMAR_PORT:-5003}}"

echo "Starting LUMEN AI service (grammar + essay + chat) on http://0.0.0.0:${PORT}"
echo "Press Ctrl+C to stop."
echo ""

exec "$PYTHON" -m uvicorn api.main:app --host 0.0.0.0 --port "$PORT"
