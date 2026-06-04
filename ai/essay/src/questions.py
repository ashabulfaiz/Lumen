"""Load essay prompts and pick randomized questions per course."""
from __future__ import annotations

import json
import random
import re
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

_LEVEL_SLUGS = frozenset({"beginner", "intermediate", "advanced"})


def _load_json(name: str) -> dict:
    path = DATA_DIR / name
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def load_questions() -> dict[str, dict[str, list[dict]]]:
    return _load_json("essay_questions.json")


def load_course_mapping() -> dict:
    return _load_json("course_mapping.json")


def normalize_level(level: str) -> str:
    key = str(level or "").strip().lower()
    aliases = {
        "bgn": "beginner",
        "int": "intermediate",
        "adv": "advanced",
        "1": "beginner",
        "2": "intermediate",
        "3": "advanced",
    }
    if key in aliases:
        return aliases[key]
    if key in _LEVEL_SLUGS:
        return key
    raise ValueError(f"Unknown level: {level!r}. Use beginner, intermediate, or advanced.")


def resolve_course_key(
    level: str,
    *,
    course_key: str | None = None,
    course_order: int | None = None,
    course_title: str | None = None,
    lesson_title: str | None = None,
) -> str:
    """Map UI/DB course metadata to a question pool key."""
    if course_key:
        key = str(course_key).strip()
        pools = load_questions().get(normalize_level(level), {})
        if key in pools:
            return key
        raise ValueError(f"Unknown course_key {key!r} for level {level!r}")

    mapping = load_course_mapping()

    if lesson_title:
        lesson_key = re.sub(r"\s+", " ", lesson_title.strip().lower())
        hit = mapping.get("by_lesson_title", {}).get(lesson_key)
        if hit:
            return hit

    if course_title:
        title_key = re.sub(r"\s+", " ", course_title.strip().lower())
        hit = mapping.get("by_course_title", {}).get(title_key)
        if hit:
            return hit

    if course_order is not None:
        level_slug = normalize_level(level)
        order_map = mapping.get("by_level_order", {}).get(level_slug, {})
        hit = order_map.get(str(int(course_order)))
        if hit:
            return hit

    raise ValueError(
        "Could not resolve course_key. Pass course_key, course_order, course_title, or lesson_title."
    )


def _seed_int(seed: str | int | None) -> int | None:
    if seed is None:
        return None
    if isinstance(seed, int):
        return seed
    text = str(seed).strip()
    if not text:
        return None
    if text.isdigit():
        return int(text)
    return sum(ord(c) for c in text) % (2**32)


def pick_questions(
    level: str,
    course_key: str,
    *,
    count: int = 1,
    seed: str | int | None = None,
    exclude_ids: list[int] | None = None,
) -> list[dict[str, Any]]:
    """
    Return up to `count` shuffled questions from the course pool.
    Use `seed` (e.g. user_id:course_id:session) for stable picks within a session.
    """
    level_slug = normalize_level(level)
    pools = load_questions()
    pool = list(pools.get(level_slug, {}).get(course_key, []))
    if not pool:
        raise ValueError(f"No questions for level={level_slug!r}, course_key={course_key!r}")

    excluded = set(exclude_ids or [])
    candidates = [q for q in pool if q.get("id") not in excluded]
    if not candidates:
        candidates = list(pool)

    rng = random.Random(_seed_int(seed))
    rng.shuffle(candidates)
    n = max(1, min(int(count), len(candidates)))
    picked = candidates[:n]

    return [
        {
            "id": item["id"],
            "question": item["question"],
            "level": level_slug,
            "course_key": course_key,
        }
        for item in picked
    ]


def list_course_keys(level: str) -> list[str]:
    level_slug = normalize_level(level)
    return list(load_questions().get(level_slug, {}).keys())
