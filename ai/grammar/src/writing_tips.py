"""Human-friendly writing tips from grammar diff and scores."""
from __future__ import annotations

import re


def _guess_error_category(original_span: str, corrected_span: str, tag: str) -> str:
    o = (original_span or "").strip()
    c = (corrected_span or "").strip()
    if not o and c:
        return "missing_word"
    if o and not c:
        return "extra_word"
    if o.lower() == c.lower() and o != c:
        return "capitalization"
    punct = {".", ",", "!", "?", ";", ":"}
    if o in punct or c in punct or (len(o) <= 2 and len(c) <= 2):
        return "punctuation"
    if o.lower() in {"dont", "doesnt", "cant", "wont"} or "n't" in c:
        return "contraction"
    if o.endswith("s") != c.endswith("s") and len(o) < 12:
        return "verb_form"
    return "grammar"


def enrich_errors(errors: list[dict]) -> list[dict]:
    out = []
    for err in errors:
        e = dict(err)
        e["grammar_category"] = _guess_error_category(
            e.get("original_span", ""),
            e.get("corrected_span", ""),
            e.get("type", ""),
        )
        out.append(e)
    return out


def _tip_for_error(err: dict) -> str:
    cat = err.get("grammar_category", "grammar")
    o = err.get("original_span", "")
    c = err.get("corrected_span", "")

    if cat == "punctuation":
        if c in ".!?" and not o:
            return "Add ending punctuation so the sentence feels complete (e.g. a full stop)."
        if c == ",":
            return "Add a comma where ideas need a short pause."
        if o and c and o.lower() in o and len(o) > 2:
            return "Check punctuation around this phrase."
        return "Fix punctuation so the sentence reads smoothly."

    if cat == "capitalization":
        return (
            f"Capitalize names and places — write “{c}” instead of “{o}”."
            if o and c
            else "Use capital letters for proper names (people, cities, languages)."
        )

    if cat == "missing_word":
        return f"Add “{c}” — it is missing here." if c else err.get("message", "A word may be missing.")

    if cat == "extra_word":
        return f"Remove “{o}” — it is not needed here." if o else err.get("message", "You may have an extra word.")

    if cat == "verb_form":
        return f"Use the correct verb form: “{c}” instead of “{o}”." if o and c else err.get("message", "Check the verb form.")

    if cat == "contraction":
        return f"Use the natural contraction or form: “{c}” instead of “{o}”."

    if o and c:
        return f"Try “{c}” instead of “{o}”."
    return err.get("message", "Review this part of the sentence.")


def _canonical(text: str) -> str:
    return re.sub(r"[^a-z0-9]", "", text.lower())


def build_writing_tips(
    errors: list[dict],
    original: str,
    corrected: str,
    score: float,
) -> tuple[list[str], str]:
    tips: list[str] = []
    seen: set[str] = set()
    has_edits = _canonical(original) != _canonical(corrected) or bool(errors)

    if errors:
        for err in errors[:8]:
            tip = _tip_for_error(err)
            if tip not in seen:
                seen.add(tip)
                tips.append(tip)

    if has_edits and corrected.strip() != original.strip():
        if not any("comma" in t.lower() or "punctuation" in t.lower() for t in tips):
            if "," in corrected and "," not in original:
                tips.append(
                    "Add commas to separate ideas (for example after greetings and between clauses)."
                )
        tips.append("Use the suggested wording below — it fixes punctuation, names, and places.")

    if not has_edits:
        tips.append(
            "Your sentence reads clearly. Keep using commas for longer sentences and capital letters for names and places."
        )

    if not tips:
        tips.append("Read the sentence aloud once; it helps spot missing words or punctuation.")

    feedback = "\n".join(f"• {t}" for t in tips)
    return tips, feedback
