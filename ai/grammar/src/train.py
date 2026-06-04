#!/usr/bin/env python3
"""Custom training loop with tf.GradientTape and TensorBoard logging."""
from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path

import numpy as np
import tensorflow as tf

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.config import (
    BATCH_SIZE,
    CHECKPOINT_DIR,
    COLA_DIR,
    EPOCHS,
    EXPORT_KERAS,
    JFLEG_DIR,
    LEARNING_RATE,
    LOGS_DIR,
    MODELS_DIR,
    REPORTS_DIR,
    TRAINING_HISTORY_JSON,
)
from src.custom_callbacks import RubricMetricsCheckpoint
from src.custom_losses import GrammarMultiTaskLoss
from src.data_loader import load_train_val_test
from src.export_model import export_production_models
from src.model import (
    adapt_vectorizer,
    build_grammar_model,
    build_text_vectorizer,
    save_vectorizer_assets,
)


def _make_dataset(sentences, labels, scores, batch_size: int, shuffle: bool):
    ds = tf.data.Dataset.from_tensor_slices(
        (
            sentences.astype(object),
            {
                "classification": labels.astype(np.float32),
                "regression": scores.astype(np.float32),
            },
        )
    )
    if shuffle:
        ds = ds.shuffle(buffer_size=min(len(sentences), 10_000), seed=42)
    return ds.batch(batch_size).prefetch(tf.data.AUTOTUNE)


def _compute_loss(y_batch, predictions, loss_fn: GrammarMultiTaskLoss):
    """Pure-TF loss path for stable GradientTape backprop."""
    return loss_fn.call(
        (y_batch["classification"], y_batch["regression"]),
        (predictions["classification"], predictions["regression"]),
    )


@tf.function
def train_step(model, optimizer, loss_fn, x_batch, y_batch):
    with tf.GradientTape() as tape:
        predictions = model(x_batch, training=True)
        loss = _compute_loss(y_batch, predictions, loss_fn)
    gradients = tape.gradient(loss, model.trainable_variables)
    gradients, _ = tf.clip_by_global_norm(gradients, 5.0)
    optimizer.apply_gradients(zip(gradients, model.trainable_variables))
    return loss, predictions


@tf.function
def eval_step(model, loss_fn, x_batch, y_batch):
    predictions = model(x_batch, training=False)
    loss = _compute_loss(y_batch, predictions, loss_fn)
    return loss, predictions


def _batch_metrics(labels_cls, labels_reg, pred_cls, pred_reg):
    labels_cls = tf.reshape(labels_cls, (-1,))
    labels_reg = tf.reshape(labels_reg, (-1,))
    pred_cls = tf.reshape(pred_cls, (-1,))
    pred_reg = tf.reshape(pred_reg, (-1,))
    cls_pred = tf.cast(pred_cls >= 0.5, tf.float32)
    accuracy = tf.reduce_mean(tf.cast(tf.equal(labels_cls, cls_pred), tf.float32))
    mae = tf.reduce_mean(tf.abs(labels_reg - pred_reg))
    return float(accuracy.numpy()), float(mae.numpy())


def run_training(epochs: int = EPOCHS) -> dict:
    train, val, _ = load_train_val_test()

    vectorizer = build_text_vectorizer()
    adapt_vectorizer(vectorizer, train.sentences)
    save_vectorizer_assets(vectorizer)

    model = build_grammar_model(vectorizer)
    loss_fn = GrammarMultiTaskLoss()
    optimizer = tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE)
    callback = RubricMetricsCheckpoint()
    callback.set_model(model)

    train_ds = _make_dataset(
        train.sentences, train.labels, train.scores, BATCH_SIZE, shuffle=True
    )
    val_ds = _make_dataset(val.sentences, val.labels, val.scores, BATCH_SIZE, shuffle=False)

    log_dir = LOGS_DIR / datetime.now().strftime("%Y%m%d-%H%M%S")
    log_dir.mkdir(parents=True, exist_ok=True)
    summary_writer = tf.summary.create_file_writer(str(log_dir))

    history = {"epochs": [], "log_dir": str(log_dir)}

    print(f"Data source: {COLA_DIR.parent}")
    print(f"  CoLA + JFLEG — train={len(train.sentences)} val={len(val.sentences)}")
    print(f"TensorBoard log dir: {log_dir}")

    for epoch in range(epochs):
        train_losses = []
        train_accs = []
        train_maes = []

        for x_batch, y_batch in train_ds:
            loss, preds = train_step(model, optimizer, loss_fn, x_batch, y_batch)
            acc, mae = _batch_metrics(
                y_batch["classification"],
                y_batch["regression"],
                preds["classification"],
                preds["regression"],
            )
            train_losses.append(float(loss.numpy()))
            train_accs.append(acc)
            train_maes.append(mae)

        val_losses = []
        val_accs = []
        val_maes = []

        for x_batch, y_batch in val_ds:
            loss, preds = eval_step(model, loss_fn, x_batch, y_batch)
            acc, mae = _batch_metrics(
                y_batch["classification"],
                y_batch["regression"],
                preds["classification"],
                preds["regression"],
            )
            val_losses.append(float(loss.numpy()))
            val_accs.append(acc)
            val_maes.append(mae)

        epoch_logs = {
            "epoch": epoch + 1,
            "loss": float(np.mean(train_losses)),
            "accuracy": float(np.mean(train_accs)),
            "mae": float(np.mean(train_maes)),
            "val_loss": float(np.mean(val_losses)),
            "val_accuracy": float(np.mean(val_accs)),
            "val_mae": float(np.mean(val_maes)),
        }
        history["epochs"].append(epoch_logs)

        with summary_writer.as_default():
            tf.summary.scalar("loss/train", epoch_logs["loss"], step=epoch)
            tf.summary.scalar("accuracy/train", epoch_logs["accuracy"], step=epoch)
            tf.summary.scalar("mae/train", epoch_logs["mae"], step=epoch)
            tf.summary.scalar("loss/val", epoch_logs["val_loss"], step=epoch)
            tf.summary.scalar("accuracy/val", epoch_logs["val_accuracy"], step=epoch)
            tf.summary.scalar("mae/val", epoch_logs["val_mae"], step=epoch)

        callback.on_epoch_end(epoch, epoch_logs)

        print(
            f"Epoch {epoch + 1}/{epochs} — "
            f"loss={epoch_logs['loss']:.4f} acc={epoch_logs['accuracy']:.4f} mae={epoch_logs['mae']:.4f} | "
            f"val_loss={epoch_logs['val_loss']:.4f} val_acc={epoch_logs['val_accuracy']:.4f} "
            f"val_mae={epoch_logs['val_mae']:.4f}"
        )

    callback.on_train_end()

    best_weights = CHECKPOINT_DIR / "best_weights.weights.h5"
    if best_weights.is_file():
        model.load_weights(best_weights)
        print(f"Loaded best checkpoint: {best_weights}")

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    try:
        export_production_models(model)
    except Exception as exc:
        print(f"Export warning: {exc}")

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    TRAINING_HISTORY_JSON.write_text(json.dumps(history, indent=2), encoding="utf-8")
    print(f"Training history saved to {TRAINING_HISTORY_JSON}")
    print(f"Model saved to {EXPORT_KERAS}")

    return history


def main():
    tf.random.set_seed(42)
    np.random.seed(42)
    run_training()


if __name__ == "__main__":
    main()
