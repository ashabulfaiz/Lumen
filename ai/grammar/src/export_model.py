"""Export trained model to production TensorFlow formats."""
from pathlib import Path

import tensorflow as tf

from src.config import EXPORT_KERAS, EXPORT_SAVEDMODEL, MODELS_DIR
from src.custom_layers import GrammarAttentionPooling
from src.custom_losses import GrammarMultiTaskLoss

CUSTOM_OBJECTS = {
    "GrammarAttentionPooling": GrammarAttentionPooling,
    "GrammarMultiTaskLoss": GrammarMultiTaskLoss,
}


def export_production_models(model: tf.keras.Model) -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    model.save(EXPORT_KERAS)
    print(f"Exported .keras -> {EXPORT_KERAS}")

    if EXPORT_SAVEDMODEL.exists():
        import shutil

        shutil.rmtree(EXPORT_SAVEDMODEL)

    try:
        # Keras 3 export (includes preprocessing + custom layers)
        model.export(str(EXPORT_SAVEDMODEL))
        print(f"Exported SavedModel -> {EXPORT_SAVEDMODEL}")
    except Exception as exc:
        print(f"Warning: SavedModel export failed ({exc}). .keras artifact is available.")


def load_production_model(keras_path: Path = EXPORT_KERAS) -> tf.keras.Model:
    if not keras_path.is_file():
        raise FileNotFoundError(
            f"Model not found at {keras_path}. Run: python -m src.train"
        )
    return tf.keras.models.load_model(keras_path, custom_objects=CUSTOM_OBJECTS)
