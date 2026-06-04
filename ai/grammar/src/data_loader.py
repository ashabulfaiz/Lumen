"""Load and merge local CoLA + JFLEG CSV datasets."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

from src.config import COLA_DIR, JFLEG_DIR, RANDOM_SEED

# JFLEG-derived soft scores (used until DS provides explicit scores)
JFLEG_FLAWED_SCORE = 0.15
JFLEG_CORRECTED_SCORE = 0.92


@dataclass
class GrammarDataset:
    sentences: np.ndarray
    labels: np.ndarray
    scores: np.ndarray
    source: np.ndarray  # "cola" | "jfleg_flawed" | "jfleg_corrected"


def _read_csv(path: Path) -> Optional[pd.DataFrame]:
    if not path.is_file():
        return None
    return pd.read_csv(path)


def _load_cola_split(split: str) -> pd.DataFrame:
    path = COLA_DIR / f"{split}.csv"
    df = _read_csv(path)
    if df is None:
        return pd.DataFrame(columns=["sentence", "label", "acceptability_score", "source"])

    df = df.copy()
    df["sentence"] = df["sentence"].astype(str).str.strip()
    df["label"] = df["label"].astype(int)

    if "acceptability_score" in df.columns:
        df["acceptability_score"] = pd.to_numeric(df["acceptability_score"], errors="coerce")
    else:
        df["acceptability_score"] = np.nan

    missing = df["acceptability_score"].isna()
    df.loc[missing, "acceptability_score"] = df.loc[missing, "label"].astype(float)
    df["acceptability_score"] = df["acceptability_score"].clip(0.0, 1.0)
    df["source"] = "cola"
    return df[["sentence", "label", "acceptability_score", "source"]]


def _load_jfleg_split(split: str) -> pd.DataFrame:
    path = JFLEG_DIR / f"{split}.csv"
    df = _read_csv(path)
    if df is None:
        return pd.DataFrame(columns=["sentence", "label", "acceptability_score", "source"])

    rows = []
    for _, row in df.iterrows():
        flawed = str(row["flawed_sentence"]).strip()
        corrected = str(row["corrected_sentence"]).strip()
        score_bad = float(row.get("acceptability_score_flawed", JFLEG_FLAWED_SCORE))
        score_good = float(row.get("acceptability_score_corrected", JFLEG_CORRECTED_SCORE))

        rows.append(
            {
                "sentence": flawed,
                "label": 0,
                "acceptability_score": score_bad,
                "source": "jfleg_flawed",
            }
        )
        rows.append(
            {
                "sentence": corrected,
                "label": 1,
                "acceptability_score": score_good,
                "source": "jfleg_corrected",
            }
        )

    return pd.DataFrame(rows)


def load_split(split: str) -> GrammarDataset:
    """Load one split: train | val | test."""
    frames = [_load_cola_split(split), _load_jfleg_split(split)]
    merged = pd.concat([f for f in frames if len(f)], ignore_index=True)

    if merged.empty:
        raise FileNotFoundError(
            f"No data for split '{split}'. Add CSV files under data/cola/ and data/jfleg/ "
            f"(see data/README.md)."
        )

    # DS team usually deduplicates upstream; avoid aggressive drops here to keep volume.
    merged = merged.drop_duplicates(
        subset=["sentence", "label", "acceptability_score"]
    ).reset_index(drop=True)
    rng = np.random.default_rng(RANDOM_SEED)
    indices = rng.permutation(len(merged))
    merged = merged.iloc[indices].reset_index(drop=True)

    return GrammarDataset(
        sentences=merged["sentence"].to_numpy(dtype=object),
        labels=merged["label"].to_numpy(dtype=np.float32),
        scores=merged["acceptability_score"].to_numpy(dtype=np.float32),
        source=merged["source"].to_numpy(dtype=object),
    )


def load_train_val_test() -> tuple[GrammarDataset, GrammarDataset, GrammarDataset]:
    train = load_split("train")
    try:
        val = load_split("val")
    except FileNotFoundError:
        val = None
    test = load_split("test")

    if val is None or len(val.sentences) == 0:
        from sklearn.model_selection import train_test_split

        idx = np.arange(len(train.sentences))
        tr_idx, val_idx = train_test_split(
            idx, test_size=0.15, random_state=RANDOM_SEED, stratify=train.labels
        )
        val = GrammarDataset(
            sentences=train.sentences[val_idx],
            labels=train.labels[val_idx],
            scores=train.scores[val_idx],
            source=train.source[val_idx],
        )
        train = GrammarDataset(
            sentences=train.sentences[tr_idx],
            labels=train.labels[tr_idx],
            scores=train.scores[tr_idx],
            source=train.source[tr_idx],
        )

    return train, val, test
