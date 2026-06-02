"""Grammar acceptability model — TensorFlow Functional API."""
from __future__ import annotations

import json
from pathlib import Path

import tensorflow as tf

from src.config import (
    DROPOUT_RATE,
    EMBEDDING_DIM,
    HIDDEN_UNITS,
    MAX_SEQUENCE_LENGTH,
    MODELS_DIR,
    VOCAB_SIZE,
    VECTORIZER_CONFIG,
    VOCAB_PATH,
)
from src.custom_layers import GrammarAttentionPooling


def build_text_vectorizer(vocabulary: list[str] | None = None) -> tf.keras.layers.TextVectorization:
    vectorizer = tf.keras.layers.TextVectorization(
        max_tokens=VOCAB_SIZE,
        output_mode="int",
        output_sequence_length=MAX_SEQUENCE_LENGTH,
        standardize="lower_and_strip_punctuation",
    )
    if vocabulary is not None:
        vectorizer.set_vocabulary(vocabulary)
    return vectorizer


def build_grammar_model(
    vectorizer: tf.keras.layers.TextVectorization,
    name: str = "grammar_acceptability",
) -> tf.keras.Model:
    """
    Functional API model with custom attention pooling and dual outputs:
    - classification: acceptable probability
    - regression: acceptability score in [0, 1]
    """
    text_input = tf.keras.Input(shape=(), dtype=tf.string, name="sentence")
    token_ids = vectorizer(text_input)

    embedded = tf.keras.layers.Embedding(
        input_dim=VOCAB_SIZE,
        output_dim=EMBEDDING_DIM,
        mask_zero=True,
        name="token_embedding",
    )(token_ids)

    x = tf.keras.layers.Dropout(DROPOUT_RATE)(embedded)
    pooled = GrammarAttentionPooling(units=64, name="grammar_attention_pool")(x)

    dense = tf.keras.layers.Dense(HIDDEN_UNITS, activation="relu")(pooled)
    dense = tf.keras.layers.Dropout(DROPOUT_RATE)(dense)

    cls_output = tf.keras.layers.Dense(1, activation="sigmoid", name="classification")(dense)
    reg_output = tf.keras.layers.Dense(1, activation="sigmoid", name="regression")(dense)

    return tf.keras.Model(
        inputs=text_input,
        outputs={"classification": cls_output, "regression": reg_output},
        name=name,
    )


def adapt_vectorizer(vectorizer: tf.keras.layers.TextVectorization, sentences) -> None:
    vectorizer.adapt(tf.data.Dataset.from_tensor_slices(sentences).batch(256))


def save_vectorizer_assets(vectorizer: tf.keras.layers.TextVectorization) -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    vocab = vectorizer.get_vocabulary()
    VOCAB_PATH.write_text(json.dumps(vocab, ensure_ascii=False), encoding="utf-8")
    VECTORIZER_CONFIG.write_text(
        json.dumps(
            {
                "max_tokens": VOCAB_SIZE,
                "output_sequence_length": MAX_SEQUENCE_LENGTH,
                "vocab_size": len(vocab),
            },
            indent=2,
        ),
        encoding="utf-8",
    )


def load_vectorizer_from_assets() -> tf.keras.layers.TextVectorization:
    if not VOCAB_PATH.is_file():
        raise FileNotFoundError(
            f"Vocabulary not found at {VOCAB_PATH}. Train the model first."
        )
    vocab = json.loads(VOCAB_PATH.read_text(encoding="utf-8"))
    vectorizer = build_text_vectorizer(vocabulary=vocab)
    return vectorizer
