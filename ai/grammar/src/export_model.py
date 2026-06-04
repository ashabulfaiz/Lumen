"""Export trained model to production TensorFlow formats."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import tensorflow as tf

from src.config import EXPORT_KERAS, EXPORT_SAVEDMODEL, MODELS_DIR
from src.custom_layers import GrammarAttentionPooling
from src.custom_losses import GrammarMultiTaskLoss

CUSTOM_OBJECTS = {
    "GrammarAttentionPooling": GrammarAttentionPooling,
    "GrammarMultiTaskLoss": GrammarMultiTaskLoss,
}

# Keras 3.4+ may serialize layers with keys older point releases reject at load time.
_UNSUPPORTED_LAYER_CONFIG_KEYS = frozenset({"quantization_config"})


def _strip_unsupported_layer_keys(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {
            key: _strip_unsupported_layer_keys(value)
            for key, value in obj.items()
            if key not in _UNSUPPORTED_LAYER_CONFIG_KEYS
        }
    if isinstance(obj, list):
        return [_strip_unsupported_layer_keys(item) for item in obj]
    return obj


def patch_keras_deserialization_compat() -> None:
    """Allow loading .keras files saved on newer Keras with older runtime builds."""
    try:
        from keras.src.saving import serialization_lib
    except ImportError:
        try:
            from keras.saving import serialization_lib  # type: ignore
        except ImportError:
            return

    if getattr(serialization_lib, "_lumen_keras_compat_patched", False):
        return

    original = serialization_lib.deserialize_keras_object

    def deserialize_keras_object(config, custom_objects=None, **kwargs):
        if isinstance(config, dict):
            config = _strip_unsupported_layer_keys(config)
        return original(config, custom_objects=custom_objects, **kwargs)

    serialization_lib.deserialize_keras_object = deserialize_keras_object
    serialization_lib._lumen_keras_compat_patched = True


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
    patch_keras_deserialization_compat()
    try:
        return tf.keras.models.load_model(keras_path, custom_objects=CUSTOM_OBJECTS)
    except TypeError as exc:
        if "quantization_config" not in str(exc):
            raise
        # Fallback: rewrite config inside the .keras zip, then load again.
        return _load_model_after_config_strip(keras_path)


def _load_model_after_config_strip(keras_path: Path) -> tf.keras.Model:
    import json
    import tempfile
    import zipfile

    patch_keras_deserialization_compat()

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir) / "patched.keras"
        with zipfile.ZipFile(keras_path, "r") as zin, zipfile.ZipFile(tmp_path, "w") as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                if item.filename == "config.json":
                    config = json.loads(data.decode("utf-8"))
                    config = _strip_unsupported_layer_keys(config)
                    data = json.dumps(config).encode("utf-8")
                zout.writestr(item, data)
        return tf.keras.models.load_model(tmp_path, custom_objects=CUSTOM_OBJECTS)
