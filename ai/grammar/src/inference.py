"""Production inference — no training/evaluation metrics exposed."""
from __future__ import annotations

from dataclasses import dataclass

import tensorflow as tf

from src.config import ACCEPTABILITY_THRESHOLD, EXPORT_KERAS
from src.export_model import load_production_model


@dataclass
class PredictionResult:
    sentence: str
    acceptability_score: float
    is_acceptable: bool
    status: str
    classification_probability: float

    def to_api_dict(self) -> dict:
        """API-safe payload: scores only, no accuracy/MAE/training metrics."""
        return {
            "sentence": self.sentence,
            "acceptability_score": self.acceptability_score,
            "is_acceptable": self.is_acceptable,
            "status": self.status,
            "classification_probability": self.classification_probability,
        }


class GrammarAcceptabilityPredictor:
    def __init__(self, model_path=None):
        self._model = load_production_model(model_path or EXPORT_KERAS)

    def predict(self, sentence: str) -> PredictionResult:
        sentence = str(sentence).strip()
        if not sentence:
            raise ValueError("Sentence cannot be empty.")

        batch = tf.constant([sentence], dtype=tf.string)
        outputs = self._model(batch, training=False)

        cls_prob = float(outputs["classification"].numpy()[0, 0])
        reg_score = float(outputs["regression"].numpy()[0, 0])
        score = round((cls_prob + reg_score) / 2.0, 4)

        is_ok = score >= ACCEPTABILITY_THRESHOLD
        if score >= 0.90:
            status = "acceptable"
        elif score <= 0.55:
            status = "unacceptable"
        else:
            status = "borderline"

        return PredictionResult(
            sentence=sentence,
            acceptability_score=score,
            is_acceptable=is_ok,
            status=status,
            classification_probability=round(cls_prob, 4),
        )


_predictor: GrammarAcceptabilityPredictor | None = None


def get_predictor() -> GrammarAcceptabilityPredictor:
    global _predictor
    if _predictor is None:
        _predictor = GrammarAcceptabilityPredictor()
    return _predictor
