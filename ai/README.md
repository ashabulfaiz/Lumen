# LUMEN AI Services

Gabungan dari **test-sentence**: Groq chat + model grammar TensorFlow.

| Service | Port | Folder |
|---------|------|--------|
| Chat (Groq) | 5001 | `ai/chat/` |
| Grammar (TensorFlow) | 5003 | `ai/grammar/` |
| Data Science | 5002 | `../ds-service/` (terpisah) |

## Setup cepat

```bash
# 1. Virtual env untuk chat (Groq)
cd ai/chat
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # isi GROQ_API_KEY=...

# 2. Virtual env untuk grammar (TensorFlow)
cd ../grammar
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Jalankan keduanya
cd ..
./start.sh
```

## Environment

Di `ai/chat/.env`:

```
GROQ_API_KEY=your_groq_api_key
```

Di root `Lumen/.env` (untuk Node + Vite):

```
AI_CHAT_URL=http://127.0.0.1:5001
VITE_AI_CHAT_URL=http://localhost:5001
VITE_GRAMMAR_API_URL=http://localhost:5003
```

## Endpoint utama

- `POST http://localhost:5001/api/chat` — chatbot Groq
- `POST http://localhost:5001/api/ai/correct` — koreksi grammar via Groq (dipakai Node `/api/grammar/check`)
- `POST http://localhost:5003/check-grammar` — scoring TensorFlow (dipakai frontend `grammarApi.js`)
