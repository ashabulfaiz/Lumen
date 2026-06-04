"""Full grammar review pipeline for the web app (TensorFlow scoring, no pretrained)."""
from __future__ import annotations

from src.config import LEVEL_ADVANCED_MIN, LEVEL_INTERMEDIATE_MIN
from src.correction import build_polished_versions, extract_error_spans, suggest_correction
from src.inference import get_predictor
from src.writing_tips import build_writing_tips, enrich_errors


def score_to_writing_level(score: float) -> str:
    if score >= LEVEL_ADVANCED_MIN:
        return "Advanced"
    if score >= LEVEL_INTERMEDIATE_MIN:
        return "Intermediate"
    return "Beginner"


def _score_percent(score: float) -> int:
    return int(round(max(0.0, min(1.0, float(score))) * 100))


def grammar_pipeline(sentence: str, mode: str = "grade") -> dict:
    """
    mode:
      - grade: score + level + polished correction (lesson review)
      - assist: writing tips only (no score fields)
    """
    sentence = str(sentence).strip()
    if not sentence:
        return {"status": "empty", "message": "Input is empty."}

    if mode not in ("grade", "assist"):
        mode = "grade"

    try:
        predictor = get_predictor()
    except FileNotFoundError as exc:
        return {"status": "error", "message": str(exc)}

    base_corrected = suggest_correction(sentence)
    diff_target, corrected_text = build_polished_versions(sentence, base_corrected)
    errors = enrich_errors(extract_error_spans(sentence, diff_target))
    has_changes = sentence.strip().lower() != corrected_text.strip().lower()

    original_pred = predictor.predict(sentence)
    grammar_score = original_pred.acceptability_score

    writing_tips, feedback = build_writing_tips(
        errors, sentence, corrected_text, grammar_score
    )

    result = {
        "input_sentence": sentence,
        "corrected_sentence": corrected_text,
        "errors": errors,
        "error_spans": errors,
        "has_grammar_errors": bool(errors),
        "sentence_changed": has_changes,
        "feedback": feedback,
        "writing_tips": writing_tips,
    }

    if mode == "assist":
        return result

    result.update(
        {
            "grammar_score": grammar_score,
            "score_percent": _score_percent(grammar_score),
            "writing_level": score_to_writing_level(grammar_score),
        }
    )
    return result
