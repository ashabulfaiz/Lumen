"""Rubric metadata and band labels for essay scoring."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

DIMENSION_KEYS = ("grammar", "vocabulary", "relevance", "coherence")


def load_rubric() -> dict[str, Any]:
    with (DATA_DIR / "essay_rubric.json").open(encoding="utf-8") as fh:
        return json.load(fh)


def band_for_score(dimension: str, score: float) -> dict[str, Any]:
    rubric = load_rubric()
    dim = rubric["dimensions"][dimension]
    bands = sorted(dim["bands"], key=lambda b: b["min"], reverse=True)
    for band in bands:
        if score >= band["min"]:
            return {
                "label": band["label"],
                "criteria": band["criteria"],
                "min": band["min"],
            }
    return bands[-1] if bands else {"label": "—", "criteria": "", "min": 0}


def dimension_meta() -> dict[str, Any]:
    rubric = load_rubric()
    out: dict[str, Any] = {}
    for key in DIMENSION_KEYS:
        dim = rubric["dimensions"][key]
        out[key] = {
            "weight": dim["weight"],
            "label": dim["label"],
            "description": dim["description"],
            "bands": dim["bands"],
        }
    return out


def weighted_overall(scores: dict[str, float]) -> float:
    rubric = load_rubric()
    total = 0.0
    weight_sum = 0.0
    for key in DIMENSION_KEYS:
        w = float(rubric["dimensions"][key]["weight"])
        total += scores.get(key, 0.0) * w
        weight_sum += w
    return round(total / weight_sum, 1) if weight_sum else 0.0


def pass_threshold() -> int:
    return int(load_rubric().get("pass_threshold", 60))
