#!/usr/bin/env bash
# Run Chat (Groq) + Grammar (TensorFlow) together
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

CHAT_PYTHON="${PYTHON:-python3}"
GRAMMAR_PYTHON="${PYTHON:-python3}"

if [[ -x "$ROOT/chat/.venv/bin/python" ]]; then
  CHAT_PYTHON="$ROOT/chat/.venv/bin/python"
fi

if [[ -x "$ROOT/grammar/.venv/bin/python" ]]; then
  GRAMMAR_PYTHON="$ROOT/grammar/.venv/bin/python"
fi

GRAMMAR_PORT="${GRAMMAR_PORT:-5003}"
CHAT_PORT="${CHAT_PORT:-5001}"

cleanup() {
  [[ -n "${GRAMMAR_PID:-}" ]] && kill "$GRAMMAR_PID" 2>/dev/null || true
  [[ -n "${CHAT_PID:-}" ]] && kill "$CHAT_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting AI services..."
echo "  Grammar (TensorFlow): http://0.0.0.0:${GRAMMAR_PORT}"
echo "  Chat (Groq):          http://0.0.0.0:${CHAT_PORT}"
echo "Press Ctrl+C to stop both."
echo ""

(
  cd "$ROOT/grammar"
  exec "$GRAMMAR_PYTHON" -m uvicorn api.main:app --host 0.0.0.0 --port "$GRAMMAR_PORT"
) &
GRAMMAR_PID=$!

(
  cd "$ROOT/chat"
  export FLASK_APP=app.py
  exec "$CHAT_PYTHON" -c "
from app import app
app.run(host='0.0.0.0', port=${CHAT_PORT}, debug=False, use_reloader=False)
"
) &
CHAT_PID=$!

wait "$GRAMMAR_PID" "$CHAT_PID"
