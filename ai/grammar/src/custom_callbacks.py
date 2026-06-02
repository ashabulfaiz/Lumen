"""Custom training callbacks."""
from __future__ import annotations

import json
from pathlib import Path

import tensorflow as tf

from src.config import CHECKPOINT_DIR, MIN_ACCURACY, MAX_MAE


class RubricMetricsCheckpoint(tf.keras.callbacks.Callback):
    """
    Saves best weights when validation meets rubric-style targets.
    Metrics are logged to TensorBoard via the training loop; this callback only checkpoints.
    """

    def __init__(
        self,
        checkpoint_dir: Path = CHECKPOINT_DIR,
        min_accuracy: float = MIN_ACCURACY,
        max_mae: float = MAX_MAE,
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.checkpoint_dir = Path(checkpoint_dir)
        self.min_accuracy = min_accuracy
        self.max_mae = max_mae
        self.best_combined = -1.0
        self.history: list[dict] = []

    def on_epoch_end(self, epoch, logs=None):
        logs = logs or {}
        val_acc = logs.get("val_accuracy", 0.0)
        val_mae = logs.get("val_mae", 1.0)
        combined = val_acc - val_mae

        record = {
            "epoch": epoch + 1,
            "val_accuracy": float(val_acc),
            "val_mae": float(val_mae),
            "meets_accuracy": val_acc >= self.min_accuracy,
            "meets_mae": val_mae <= self.max_mae,
        }
        self.history.append(record)

        if combined > self.best_combined:
            self.best_combined = combined
            self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
            weights_path = self.checkpoint_dir / "best_weights.weights.h5"
            self.model.save_weights(weights_path)
            record["saved_checkpoint"] = str(weights_path)
        else:
            record["saved_checkpoint"] = None

        if val_acc >= self.min_accuracy and val_mae <= self.max_mae:
            print(
                f"  [RubricMetricsCheckpoint] Targets met at epoch {epoch + 1}: "
                f"acc={val_acc:.4f} mae={val_mae:.4f}"
            )

    def on_train_end(self, logs=None):
        path = self.checkpoint_dir / "callback_history.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.history, indent=2), encoding="utf-8")
