#!/usr/bin/env python3
"""
Generate development sample CSVs mimicking cleaned CoLA + JFLEG layout.
Replace these files with Data Science exports for production training.
"""
from pathlib import Path
import csv
import random

random.seed(42)

ROOT = Path(__file__).resolve().parent.parent
COLA_DIR = ROOT / "data" / "cola"
JFLEG_DIR = ROOT / "data" / "jfleg"

ACCEPTABLE_TEMPLATES = [
    "She goes to school every day.",
    "They have been studying English for two years.",
    "The book that I read yesterday was interesting.",
    "He plays the piano beautifully.",
    "We will visit the museum tomorrow.",
    "I have never seen such a beautiful sunset.",
    "The students completed their homework on time.",
    "She speaks three languages fluently.",
    "The meeting was postponed until next Monday.",
    "Children should eat healthy food every day.",
    "He works as a software engineer in Jakarta.",
    "The weather today is warmer than yesterday.",
    "My sister bought a new laptop last week.",
    "Reading books helps improve your vocabulary.",
    "The train arrived at the station on schedule.",
]

UNACCEPTABLE_PATTERNS = [
    ("She go to school every day.", 0.11),
    ("They has been study English.", 0.09),
    ("He play piano beautiful.", 0.14),
    ("We will visiting museum tomorrow.", 0.13),
    ("I have never see such beautiful sunset.", 0.10),
    ("The students complete their homework on time yesterday.", 0.12),
    ("She speak three language fluent.", 0.08),
    ("The meeting were postpone until Monday.", 0.15),
    ("Children should eats healthy food.", 0.11),
    ("He work as software engineer at Jakarta.", 0.13),
    ("The weather today is more warm than yesterday.", 0.14),
    ("My sister buyed a new laptop last week.", 0.10),
    ("Reading book help improve you vocabulary.", 0.09),
    ("The train arrive at station in schedule.", 0.12),
    ("There is many problem with this sentence.", 0.11),
]

JFLEG_PAIRS = [
    ("He go to store.", "He goes to the store."),
    ("She dont like coffee.", "She doesn't like coffee."),
    ("They was happy yesterday.", "They were happy yesterday."),
    ("I has a dog.", "I have a dog."),
    ("We was going home.", "We were going home."),
    ("He dont knows the answer.", "He doesn't know the answer."),
    ("She have went to Paris.", "She has gone to Paris."),
    ("The childrens are playing.", "The children are playing."),
    ("It are raining outside.", "It is raining outside."),
    ("Me and him goes there.", "He and I go there."),
    ("She can sings well.", "She can sing well."),
    ("There is many books.", "There are many books."),
    ("He walk to school everyday.", "He walks to school every day."),
    ("They enjoys the movie.", "They enjoy the movie."),
    ("I am agree with you.", "I agree with you."),
]


def _difficulty_for_score(score: float, label: int) -> str:
    if label == 1 and score >= 0.9:
        return "advanced"
    if label == 1:
        return "intermediate"
    return "beginner"


def _write_cola(path: Path, rows: list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["sentence", "label", "acceptability_score", "difficulty"],
        )
        w.writeheader()
        for row in rows:
            row.setdefault(
                "difficulty",
                _difficulty_for_score(float(row["acceptability_score"]), int(row["label"])),
            )
        w.writerows(rows)


def _write_jfleg(path: Path, rows: list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "flawed_sentence",
                "corrected_sentence",
                "difficulty_flawed",
                "difficulty_corrected",
            ],
        )
        w.writeheader()
        for row in rows:
            row.setdefault("difficulty_flawed", "beginner")
            row.setdefault("difficulty_corrected", "advanced")
        w.writerows(rows)


def build_cola_rows(multiplier: int = 80) -> list:
    rows = []
    for rep in range(multiplier):
        for idx, sent in enumerate(ACCEPTABLE_TEMPLATES):
            rows.append(
                {
                    "sentence": f"{sent[:-1]} ref{rep}-{idx}.",
                    "label": 1,
                    "acceptability_score": 0.95,
                }
            )
        for idx, (sent, score) in enumerate(UNACCEPTABLE_PATTERNS):
            rows.append(
                {
                    "sentence": f"{sent[:-1]} err{rep}-{idx}.",
                    "label": 0,
                    "acceptability_score": round(min(score, 0.18), 4),
                }
            )
    random.shuffle(rows)
    return rows


def build_jfleg_rows(multiplier: int = 60) -> list:
    rows = []
    for rep in range(multiplier):
        for idx, (flawed, corrected) in enumerate(JFLEG_PAIRS):
            rows.append(
                {
                    "flawed_sentence": f"{flawed[:-1]} jf{rep}-{idx}.",
                    "corrected_sentence": f"{corrected[:-1]} jf{rep}-{idx}.",
                }
            )
    random.shuffle(rows)
    return rows


def split_rows(rows: list, train_ratio=0.7, val_ratio=0.15):
    n = len(rows)
    train_end = int(n * train_ratio)
    val_end = train_end + int(n * val_ratio)
    return rows[:train_end], rows[train_end:val_end], rows[val_end:]


def main():
    if (COLA_DIR / "train.csv").is_file() and (JFLEG_DIR / "train.csv").is_file():
        print("Dataset already exists in data/cola and data/jfleg — nothing to generate.")
        return

    cola_rows = build_cola_rows()
    jfleg_rows = build_jfleg_rows()

    cola_train, cola_val, cola_test = split_rows(cola_rows)
    jf_train, jf_val, jf_test = split_rows(jfleg_rows)

    _write_cola(COLA_DIR / "train.csv", cola_train)
    _write_cola(COLA_DIR / "val.csv", cola_val)
    _write_cola(COLA_DIR / "test.csv", cola_test)

    _write_jfleg(JFLEG_DIR / "train.csv", jf_train)
    _write_jfleg(JFLEG_DIR / "val.csv", jf_val)
    _write_jfleg(JFLEG_DIR / "test.csv", jf_test)

    print(f"CoLA: train={len(cola_train)} val={len(cola_val)} test={len(cola_test)}")
    print(f"JFLEG: train={len(jf_train)} val={len(jf_val)} test={len(jf_test)}")
    print("Sample data written under data/cola and data/jfleg")


if __name__ == "__main__":
    main()
