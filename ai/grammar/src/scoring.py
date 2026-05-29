"""Normalize model output for web scoring UI."""
from __future__ import annotations

from src.grammar_pipeline import grammar_pipeline, score_to_writing_level


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def enrich_for_web(result: dict) -> dict:
    """Score-only fields for lesson review (no acceptability label)."""
    if result.get("status") in ("error", "empty"):
        return result

    raw = result.get("grammar_score", 0.0)
    score = _clamp01(raw)

    enriched = {k: v for k, v in result.items() if k != "acceptability_score"}
    enriched["grammar_score"] = round(score, 4)
    enriched["score_percent"] = int(round(score * 100))
    enriched["writing_level"] = result.get("writing_level") or score_to_writing_level(score)
    return enriched


def check_and_score(sentence: str, *, include_tips: bool = True) -> dict:
    """Full grade pipeline for /check-writing and /score endpoints."""
    result = grammar_pipeline(sentence.strip(), mode="grade")
    if result.get("status") in ("error", "empty"):
        return result
    if not include_tips:
        for key in (
            "corrected_sentence",
            "errors",
            "error_spans",
            "feedback",
            "writing_tips",
        ):
            result.pop(key, None)
    return enrich_for_web(result)
