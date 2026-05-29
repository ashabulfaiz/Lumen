"""Rule-based grammar correction using local JFLEG pairs (no pretrained models)."""
from __future__ import annotations

import difflib
import re
from functools import lru_cache

import pandas as pd

from src.config import JFLEG_DIR

_RULE_FIXES = [
    (re.compile(r"\bShe go\b", re.I), "She goes"),
    (re.compile(r"\bHe go\b", re.I), "He goes"),
    (re.compile(r"\bThey was\b", re.I), "They were"),
    (re.compile(r"\bWe was\b", re.I), "We were"),
    (re.compile(r"\bI has\b", re.I), "I have"),
    (re.compile(r"\bShe have went\b", re.I), "She has gone"),
    (re.compile(r"\bdont\b", re.I), "doesn't"),
    (re.compile(r"\bdoesnt\b", re.I), "doesn't"),
    (re.compile(r"\bThere is many\b", re.I), "There are many"),
    (re.compile(r"\bchildrens\b", re.I), "children"),
    (re.compile(r"\beveryday\b", re.I), "every day"),
    (re.compile(r"\bmore warm\b", re.I), "warmer"),
    (re.compile(r"\bbuyed\b", re.I), "bought"),
]


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", str(text).strip().lower())


@lru_cache(maxsize=1)
def _load_correction_pairs() -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    for split in ("train", "val", "test"):
        path = JFLEG_DIR / f"{split}.csv"
        if not path.is_file():
            continue
        df = pd.read_csv(path)
        for _, row in df.iterrows():
            flawed = str(row.get("flawed_sentence", "")).strip()
            corrected = str(row.get("corrected_sentence", "")).strip()
            if flawed and corrected:
                pairs.append((flawed, corrected))
    return pairs


def apply_rule_fixes(sentence: str) -> str:
    text = sentence.strip()
    for pattern, replacement in _RULE_FIXES:
        text = pattern.sub(replacement, text)
    return text


def suggest_correction(sentence: str) -> str:
    """Suggest a correction via rules + nearest JFLEG pair."""
    sentence = sentence.strip()
    if not sentence:
        return sentence

    ruled = apply_rule_fixes(sentence)
    if _normalize(ruled) != _normalize(sentence):
        return ruled

    pairs = _load_correction_pairs()
    if not pairs:
        return sentence

    flawed_list = [p[0] for p in pairs]
    matches = difflib.get_close_matches(
        sentence,
        flawed_list,
        n=1,
        cutoff=0.55,
    )
    if matches:
        idx = flawed_list.index(matches[0])
        return pairs[idx][1]

    tokenized = _normalize(sentence).split()
    best_score = 0.0
    best_corrected = sentence
    for flawed, corrected in pairs:
        ratio = difflib.SequenceMatcher(
            None, tokenized, _normalize(flawed).split()
        ).ratio()
        if ratio > best_score:
            best_score = ratio
            best_corrected = corrected

    if best_score >= 0.72:
        return best_corrected
    return ruled


def build_polished_versions(original: str, base_correction: str) -> tuple[str, str]:
    """Return (diff_target, display_text) with punctuation and caps applied."""
    from src.text_polish import full_writing_polish

    diff_target = full_writing_polish(
        base_correction, original=original, add_sentence_end=False
    )
    display_text = full_writing_polish(
        base_correction, original=original, add_sentence_end=True
    )
    return diff_target, display_text


def tokenize_with_spans(text: str) -> list[dict]:
    spans = []
    for match in re.finditer(r"\w+|[^\w\s]", text):
        spans.append(
            {"token": match.group(), "start": match.start(), "end": match.end()}
        )
    return spans


def extract_error_spans(original: str, corrected: str) -> list[dict]:
    original_spans = tokenize_with_spans(original)
    corrected_spans = tokenize_with_spans(corrected)
    original_tokens = [item["token"] for item in original_spans]
    corrected_tokens = [item["token"] for item in corrected_spans]
    matcher = difflib.SequenceMatcher(None, original_tokens, corrected_tokens)

    errors = []
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            continue

        original_span = " ".join(original_tokens[i1:i2]).strip()
        corrected_span = " ".join(corrected_tokens[j1:j2]).strip()

        if tag == "replace":
            error_type = "replacement"
            message = f"Change '{original_span}' to '{corrected_span}'."
        elif tag == "delete":
            error_type = "deletion"
            message = f"Remove '{original_span}'."
        elif tag == "insert":
            error_type = "insertion"
            message = f"Add '{corrected_span}'."
        else:
            error_type = "unknown"
            message = "Fix this part of the sentence."

        highlight_start = original_spans[i1]["start"] if i1 < len(original_spans) else 0
        highlight_end = (
            original_spans[i2 - 1]["end"]
            if i2 > i1 and i2 <= len(original_spans)
            else highlight_start
        )

        errors.append(
            {
                "type": error_type,
                "grammar_category": "grammar",
                "original_span": original_span,
                "corrected_span": corrected_span,
                "message": message,
                "highlight": {
                    "start": highlight_start,
                    "end": highlight_end,
                    "text": original[highlight_start:highlight_end],
                },
            }
        )

    return errors
