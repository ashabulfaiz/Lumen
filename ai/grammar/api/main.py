"""
FastAPI grammar service — compatible with the React lesson app (/check-grammar).

Training metrics (accuracy, MAE) stay offline in reports/ only.
"""
from __future__ import annotations

import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src.config import API_HOST, API_PORT
from src.grammar_pipeline import grammar_pipeline
from src.inference import get_predictor
from src.scoring import check_and_score, enrich_for_web

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
    except FileNotFoundError as exc:
        print(f"Warning: model not loaded at startup — {exc}")


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
            "GET /health": "service status",
        },
        "writing_levels": ["Beginner", "Intermediate", "Advanced"],
        "note": "Offline rubric: reports/evaluation_metrics.json",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api.main:app", host=API_HOST, port=API_PORT, reload=False)
