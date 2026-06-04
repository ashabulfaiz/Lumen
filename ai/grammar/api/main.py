"""
FastAPI grammar service — compatible with the React lesson app (/check-grammar).

Training metrics (accuracy, MAE) stay offline in reports/ only.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
ESSAY_API = ROOT.parent / "essay" / "api"
sys.path.insert(0, str(ROOT))
if str(ESSAY_API) not in sys.path:
    sys.path.insert(0, str(ESSAY_API))

from src.config import API_HOST, API_PORT
from src.grammar_pipeline import grammar_pipeline
from src.inference import get_predictor
from src.scoring import check_and_score, enrich_for_web

from routes import router as essay_router

app = FastAPI(
    title="Grammar API (TensorFlow)",
    description="Grammar acceptability + writing level from scratch TensorFlow model.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(essay_router)


# ---------------------------------------------------------------------------
# Chat + Groq assist — merged from the former ai/chat Flask service.
# Imports are guarded so the grammar/essay endpoints keep working even if the
# optional `groq` package or GROQ_API_KEY is missing.
# ---------------------------------------------------------------------------
try:
    from dotenv import load_dotenv

    load_dotenv()
except Exception:
    pass

try:
    from groq import Groq
except ImportError:
    Groq = None

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

try:
    if Groq is None:
        raise ImportError("groq package not installed")
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not found in environment")
    groq_client = Groq(api_key=GROQ_API_KEY)
    print("Groq client ready for LUMEN chat (merged into grammar service).")
except Exception as e:
    print(f"Warning: Groq connection failed — {e}")
    groq_client = None


class ChatRequest(BaseModel):
    message: str = Field(default="")
    language: str = Field(default="id")


class CorrectRequest(BaseModel):
    text: str = Field(default="")


@app.post("/api/check-semantic")
def check_semantic():
    return {
        "similarity_score": 0.88,
        "status": "Correct",
        "feedback": "Backend connection OK.",
    }


@app.post("/api/chat")
def chat_assistant(request: ChatRequest):
    """Tutor chatbot (Groq). Called by the Node backend at /api/chat."""
    user_message = (request.message or "").lower()
    bot_language = request.language or "id"

    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    if groq_client:
        try:
            if bot_language == "en":
                system_instruction = (
                    "You are LUMEN-bot, a Native English Tutor. "
                    "You MUST reply STRICTLY in English. Be friendly, helpful, and concise."
                )
            else:
                system_instruction = (
                    "You are LUMEN-bot, an English learning assistant. "
                    "Reply briefly and warmly in Indonesian or mixed Indonesian/English."
                )

            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_message},
                ],
                model="llama-3.3-70b-versatile",
            )
            return {"reply": chat_completion.choices[0].message.content}
        except Exception as e:
            print(f"Warning: Groq chat error — {e}")

    reply = (
        "Sorry, the AI system is currently busy."
        if bot_language == "en"
        else "Maaf, sistem AI sedang sibuk."
    )
    return {"reply": reply}


@app.post("/api/ai/correct")
def ai_correct(request: CorrectRequest):
    """Groq-based grammar correction. Called by the Node backend at /api/ai/correct."""
    text = request.text or ""
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    if groq_client:
        try:
            system_instruction = (
                "You are an English Grammar Correction expert. Analyze the user's input. "
                "Provide the fully corrected sentence in the 'corrected' field. "
                "In the 'matches' field, provide an array of objects detailing the errors. Each object must contain: "
                "'message' (explanation of error), 'replacements' (array of suggestions), 'offset' (character start index), "
                "and 'length' (length of wrong word). Return the response strictly as a JSON object, no markdown."
            )

            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": text},
                ],
                model="llama-3.3-70b-versatile",
                response_format={"type": "json_object"},
            )
            return json.loads(chat_completion.choices[0].message.content)
        except Exception as e:
            print(f"Warning: Groq grammar correction error — {e}")
            raise HTTPException(status_code=500, detail=f"AI processing failed: {e}") from e

    return {"corrected": text, "matches": []}


class GrammarRequest(BaseModel):
    sentence: str = Field(..., min_length=1)
    mode: str = Field(default="grade", description="grade | assist")


class PredictRequest(BaseModel):
    sentence: str = Field(..., min_length=1)


class CheckWritingRequest(BaseModel):
    sentence: str = Field(..., min_length=1)
    include_tips: bool = Field(
        default=True,
        description="Include correction, errors, and feedback",
    )


@app.on_event("startup")
def warmup_model():
    try:
        get_predictor()
        print("Grammar model loaded successfully.")
    except FileNotFoundError as exc:
        print(f"Warning: model not loaded at startup — {exc}")
    except Exception as exc:
        print(
            "Warning: model not loaded at startup — "
            f"{exc}\n"
            "Use the project venv (cd ai/grammar && python -m venv .venv && "
            "pip install -r requirements.txt) or align TensorFlow/Keras with training."
        )


@app.get("/health")
def health():
    try:
        get_predictor()
        ready = True
        message = "TensorFlow grammar model loaded"
    except FileNotFoundError:
        ready = False
        message = "Model not trained. Run: cd ai/grammar && python -m src.train"
    return {"status": "ok" if ready else "degraded", "model_ready": ready, "message": message}


@app.post("/check-grammar")
def check_grammar(request: GrammarRequest):
    """Primary endpoint used by the web frontend (lesson assist / grade)."""
    result = grammar_pipeline(request.sentence, mode=request.mode)
    if result.get("status") == "error":
        raise HTTPException(status_code=503, detail=result.get("message", "Model unavailable"))
    if result.get("status") == "empty":
        raise HTTPException(status_code=400, detail=result.get("message", "Empty input"))
    if request.mode == "grade":
        return enrich_for_web(result)
    return result


@app.post("/check-writing")
def check_writing(request: CheckWritingRequest):
    """AI writing checker + scoring for the web checker page."""
    result = check_and_score(request.sentence, include_tips=request.include_tips)
    if result.get("status") == "error":
        raise HTTPException(status_code=503, detail=result.get("message", "Model unavailable"))
    if result.get("status") == "empty":
        raise HTTPException(status_code=400, detail=result.get("message", "Empty input"))
    return result


@app.post("/score")
def score_writing(request: PredictRequest):
    """Lightweight score-only endpoint (percent + level)."""
    result = check_and_score(request.sentence, include_tips=False)
    if result.get("status") == "error":
        raise HTTPException(status_code=503, detail=result.get("message", "Model unavailable"))
    if result.get("status") == "empty":
        raise HTTPException(status_code=400, detail=result.get("message", "Empty input"))
    return {
        "sentence": result.get("input_sentence", request.sentence),
        "grammar_score": result["grammar_score"],
        "score_percent": result["score_percent"],
        "writing_level": result["writing_level"],
    }


@app.post("/predict")
def predict(request: PredictRequest):
    """Lightweight scoring endpoint."""
    try:
        predictor = get_predictor()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    try:
        result = predictor.predict(request.sentence)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    payload = result.to_api_dict()
    from src.grammar_pipeline import score_to_writing_level

    payload["writing_level"] = score_to_writing_level(result.acceptability_score)
    return payload


@app.get("/")
def root():
    return {
        "service": "grammar-tensorflow-api",
        "stack": "TensorFlow Functional API (from scratch, no pretrained)",
        "endpoints": {
            "POST /check-grammar": {"sentence": "string", "mode": "grade | assist"},
            "POST /check-writing": {"sentence": "string", "include_tips": "bool"},
            "POST /score": {"sentence": "string"},
            "POST /predict": {"sentence": "string"},
            "GET /essay/question": "random essay prompt per course (level, course_key|order|title, seed)",
            "POST /essay/grade": "rubric scores: grammar, vocabulary, relevance, coherence",
            "GET /essay/rubric": "rubric bands and weights",
            "POST /api/chat": "tutor chatbot (Groq) — {message, language}",
            "POST /api/ai/correct": "Groq grammar correction — {text}",
            "GET /health": "service status",
        },
        "writing_levels": ["Beginner", "Intermediate", "Advanced"],
        "note": "Offline rubric: reports/evaluation_metrics.json",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api.main:app", host=API_HOST, port=API_PORT, reload=False)
