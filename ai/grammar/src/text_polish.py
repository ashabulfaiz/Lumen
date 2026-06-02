"""Punctuation, commas, contractions, and proper-noun caps for writing tips."""
from __future__ import annotations

import re

_PROPER_NOUNS: dict[str, str] = {
    "english": "English",
    "indonesia": "Indonesia",
    "indonesian": "Indonesian",
    "jakarta": "Jakarta",
    "paris": "Paris",
    "london": "London",
    "america": "America",
    "american": "American",
    "british": "British",
    "china": "China",
    "chinese": "Chinese",
    "japan": "Japan",
    "japanese": "Japanese",
    "korea": "Korea",
    "korean": "Korean",
    "monday": "Monday",
    "tuesday": "Tuesday",
    "wednesday": "Wednesday",
    "thursday": "Thursday",
    "friday": "Friday",
    "saturday": "Saturday",
    "sunday": "Sunday",
    "january": "January",
    "february": "February",
    "march": "March",
    "april": "April",
    "may": "May",
    "june": "June",
    "july": "July",
    "august": "August",
    "september": "September",
    "october": "October",
    "november": "November",
    "december": "December",
    "i": "I",
    "rina": "Rina",
    "john": "John",
    "mary": "Mary",
    "david": "David",
    "sarah": "Sarah",
    "michael": "Michael",
    "lisa": "Lisa",
    "lumen": "Lumen",
}

_CONTRACTION_FIXES = [
    (re.compile(r"\bim\b"), "I'm"),
    (re.compile(r"\bive\b"), "I've"),
    (re.compile(r"\byoure\b"), "you're"),
    (re.compile(r"\btheyre\b"), "they're"),
    (re.compile(r"\bcant\b"), "can't"),
    (re.compile(r"\bwont\b"), "won't"),
    (re.compile(r"\bdont\b"), "don't"),
    (re.compile(r"\bdoesnt\b"), "doesn't"),
    (re.compile(r"\bisnt\b"), "isn't"),
]

_PREPOSITIONS_BEFORE_PLACE = re.compile(
    r"\b(in|at|to|from|near|across|into|onto|through)\s+([a-z][a-z]+)\b",
    re.I,
)


def _split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p for p in parts if p.strip()]


def _align_sentence_starts(original: str, polished: str) -> str:
    """Keep lowercase at sentence start if the learner wrote it that way."""
    orig_sents = _split_sentences(original)
    pol_sents = _split_sentences(polished)
    if not orig_sents or len(orig_sents) != len(pol_sents):
        if original and original[0].islower() and polished:
            return polished[0].lower() + polished[1:]
        return polished

    merged = []
    for orig, pol in zip(orig_sents, pol_sents):
        pol = pol.strip()
        if orig and orig[0].islower() and pol:
            pol = pol[0].lower() + pol[1:]
        merged.append(pol)
    return " ".join(merged)


def fix_punctuation_spacing(text: str) -> str:
    if not text or not str(text).strip():
        return text

    t = re.sub(r"\s+", " ", str(text).strip())
    t = re.sub(r"\s+([.,!?;:])", r"\1", t)
    t = re.sub(r"([.,!?;:])([A-Za-z])", r"\1 \2", t)
    t = re.sub(r"([.,!?])\1+", r"\1", t)
    return t.strip()


def fix_contractions(text: str) -> str:
    t = text
    for pattern, replacement in _CONTRACTION_FIXES:
        t = pattern.sub(replacement, t)
    t = re.sub(r"\bi\b", "I", t)
    return t


def apply_intro_commas(text: str) -> str:
    """Common self-intro patterns: greetings, name, from X, and hobby."""
    t = text

    t = re.sub(
        r"^(hello|hi|hey)\s+(my name is\b)",
        r"\1, \2",
        t,
        flags=re.I,
    )

    t = re.sub(
        r"\b(my name is)\s+([a-z][a-z']*)\s+(im|i am|i'm)\s+(from\b)",
        lambda m: f"{m.group(1)} {m.group(2).capitalize()}, I'm {m.group(4)}",
        t,
        flags=re.I,
    )

    t = re.sub(
        r"\b(my name is)\s+([a-z][a-z']*)\s+(and\s+my\b)",
        lambda m: f"{m.group(1)} {m.group(2).capitalize()}, {m.group(3)}",
        t,
        flags=re.I,
    )

    t = re.sub(
        r"\b(from\s+[A-Za-z][a-z']*)\s+(and\s+my\b)",
        r"\1, \2",
        t,
        flags=re.I,
    )

    t = re.sub(
        r"\b([a-z][a-z']+)\s+(and\s+my\s+hobby\s+is\b)",
        r"\1, \2",
        t,
        flags=re.I,
    )

    return t


def capitalize_proper_nouns(text: str) -> str:
    if not text:
        return text

    def repl(match: re.Match) -> str:
        word = match.group(0)
        key = word.lower()
        if key in _PROPER_NOUNS:
            return _PROPER_NOUNS[key]
        return word

    t = re.sub(r"\b[A-Za-z][A-Za-z']*\b", repl, text)

    def place_after_prep(match: re.Match) -> str:
        prep, word = match.group(1), match.group(2)
        key = word.lower()
        if key in _PROPER_NOUNS:
            return f"{prep} {_PROPER_NOUNS[key]}"
        if key in {"store", "school", "home", "work", "hobby"}:
            return match.group(0)
        if len(word) >= 4 and word[0].islower():
            return f"{prep} {word.capitalize()}"
        return match.group(0)

    t = _PREPOSITIONS_BEFORE_PLACE.sub(place_after_prep, t)

    t = re.sub(
        r"\b(my name is)\s+([a-z][a-z']+)\b",
        lambda m: f"{m.group(1)} {m.group(2).capitalize()}",
        t,
        flags=re.I,
    )
    return t


def ensure_sentence_ending(text: str) -> str:
    t = text.strip()
    if not t:
        return t
    if len(t.split()) >= 3 and t[-1].isalnum():
        return t + "."
    return t


def full_writing_polish(
    text: str,
    original: str | None = None,
    *,
    add_sentence_end: bool = True,
) -> str:
    if not text:
        return text

    polished = fix_punctuation_spacing(text)
    polished = apply_intro_commas(polished)
    polished = fix_contractions(polished)
    polished = capitalize_proper_nouns(polished)
    if original:
        polished = _align_sentence_starts(original, polished)
    if add_sentence_end:
        polished = ensure_sentence_ending(polished)
    return polished


def polish_writing_text(
    text: str,
    original: str | None = None,
    *,
    add_sentence_end: bool = True,
) -> str:
    return full_writing_polish(text, original, add_sentence_end=add_sentence_end)
