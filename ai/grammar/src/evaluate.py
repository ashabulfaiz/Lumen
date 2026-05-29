#!/usr/bin/env python3
"""
Offline evaluation — accuracy & MAE written to reports/ only.
Never returned by the inference API or frontend.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import tensorflow as tf

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.config import (
    EVAL_METRICS_JSON,
    EVAL_SUMMARY_TXT,
    EXPORT_KERAS,
    MAX_MAE,
    MIN_ACCURACY,
    REPORTS_DIR,
)
from src.data_loader import load_split
from src.export_model import load_production_model


def evaluate_split(model, dataset_name: str, split: str) -> dict:
    data = load_split(split)
    batch_input = data.sentences.astype(object)

    outputs = model(batch_input, training=False)
    cls_prob = outputs["classification"].numpy().reshape(-1)
    reg_pred = outputs["regression"].numpy().reshape(-1)
    cls_pred = (cls_prob >= 0.5).astype(int)
    combined_score = (cls_prob + reg_pred) / 2.0

    labels = data.labels.astype(int)
    accuracy = float(np.mean(cls_pred == labels))
    # MAE diukur pada head regresi (skor acceptability 0–1)
    mae = float(np.mean(np.abs(data.scores - reg_pred)))

    by_source = {}
    for src in np.unique(data.source):
        mask = data.source == src
        if mask.sum() == 0:
            continue
        by_source[src] = {
            "count": int(mask.sum()),
            "accuracy": float(np.mean(cls_pred[mask] == labels[mask])),
            "mae": float(np.mean(np.abs(data.scores[mask] - reg_pred[mask]))),
        }

    return {
        "dataset": dataset_name,
        "split": split,
        "samples": int(len(labels)),
        "accuracy": round(accuracy, 4),
        "mae": round(mae, 4),
        "meets_min_accuracy": accuracy >= MIN_ACCURACY,
        "meets_max_mae": mae <= MAX_MAE,
        "rubric_passed": accuracy >= MIN_ACCURACY and mae <= MAX_MAE,
        "by_source": by_source,
    }


def run_evaluation() -> dict:
    model = load_production_model(EXPORT_KERAS)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    results = {
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
        "model_path": str(EXPORT_KERAS),
        "thresholds": {"min_accuracy": MIN_ACCURACY, "max_mae": MAX_MAE},
        "splits": [],
    }

    for split in ("train", "val", "test"):
        try:
            results["splits"].append(evaluate_split(model, "cola+jfleg", split))
        except FileNotFoundError:
            continue

    test_results = [s for s in results["splits"] if s["split"] == "test"]
    if test_results:
        results["primary"] = test_results[0]
        results["rubric_passed"] = test_results[0]["rubric_passed"]
    else:
        results["rubric_passed"] = False

    EVAL_METRICS_JSON.write_text(json.dumps(results, indent=2), encoding="utf-8")

    lines = [
        "Grammar Acceptability — Evaluation Report",
        "=" * 44,
        f"Model: {EXPORT_KERAS}",
        f"Generated: {results['evaluated_at']}",
        "",
        f"Rubric: accuracy >= {MIN_ACCURACY:.0%}, MAE <= {MAX_MAE}",
        f"Overall pass (test): {results.get('rubric_passed', False)}",
        "",
    ]
    for split in results["splits"]:
        lines.append(
            f"[{split['split'].upper()}] n={split['samples']} "
            f"accuracy={split['accuracy']:.4f} mae={split['mae']:.4f} "
            f"pass={split['rubric_passed']}"
        )
    lines.append("")
    lines.append("This file is for ML/offline review only — not exposed via API.")

    EVAL_SUMMARY_TXT.write_text("\n".join(lines), encoding="utf-8")

    print("\n".join(lines))
    print(f"\nMetrics JSON: {EVAL_METRICS_JSON}")
    return results


def main():
    run_evaluation()


if __name__ == "__main__":
    main()
