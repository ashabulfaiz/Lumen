"""FastAPI route handlers for essay prompts and rubric grading."""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

ESSAY_SRC = Path(__file__).resolve().parent.parent / "src"
if str(ESSAY_SRC) not in sys.path:
    sys.path.insert(0, str(ESSAY_SRC))

from grading import grade_essay  # noqa: E402
from questions import (  # noqa: E402
    list_course_keys,
    normalize_level,
    pick_questions,
    resolve_course_key,
)
from rubric import dimension_meta, load_rubric, pass_threshold  # noqa: E402

router = APIRouter(prefix="/essay", tags=["essay"])


class EssayGradeRequest(BaseModel):
    question: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)
    level: str = Field(default="beginner")
    grammar_score_percent: int | None = Field(
        default=None,
        description="Optional grammar % from /check-grammar; computed server-side if omitted",
    )


def _grammar_percent_from_pipeline(answer: str) -> float | None:
    grammar_root = Path(__file__).resolve().parent.parent.parent / "grammar"
    if str(grammar_root) not in sys.path:
        sys.path.insert(0, str(grammar_root))
    try:
        from src.grammar_pipeline import grammar_pipeline  # noqa: E402
        from src.scoring import enrich_for_web  # noqa: E402
    except ImportError:
        return None

    result = grammar_pipeline(answer.strip(), mode="grade")
    if result.get("status") in ("error", "empty"):
        return None
    enriched = enrich_for_web(result)
    return float(enriched.get("score_percent", 50))


@router.get("/rubric")
def get_rubric():
    rubric = load_rubric()
    return {
        "version": rubric.get("version"),
        "pass_threshold": pass_threshold(),
        "dimensions": dimension_meta(),
    }


@router.get("/courses")
def get_courses(level: str = Query(..., description="beginner | intermediate | advanced")):
    try:
        level_slug = normalize_level(level)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"level": level_slug, "course_keys": list_course_keys(level_slug)}


@router.get("/question")
def get_question(
    level: str = Query(...),
    course_key: str | None = Query(default=None),
    course_order: int | None = Query(default=None),
    course_title: str | None = Query(default=None),
    lesson_title: str | None = Query(default=None),
    count: int = Query(default=1, ge=1, le=5),
    seed: str | None = Query(
        default=None,
        description="Stable seed per user/course/session so prompts vary but repeat within a session",
    ),
):
    try:
        level_slug = normalize_level(level)
        key = resolve_course_key(
            level_slug,
            course_key=course_key,
            course_order=course_order,
            course_title=course_title,
            lesson_title=lesson_title,
        )
        questions = pick_questions(level_slug, key, count=count, seed=seed)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "level": level_slug,
        "course_key": key,
        "count": len(questions),
        "questions": questions,
    }


@router.post("/grade")
def post_grade(body: EssayGradeRequest) -> dict[str, Any]:
    grammar_percent = body.grammar_score_percent
    if grammar_percent is None:
        grammar_percent = _grammar_percent_from_pipeline(body.answer)
    if grammar_percent is None:
        grammar_percent = 50

    try:
        return grade_essay(
            question=body.question,
            answer=body.answer,
            level=body.level,
            grammar_score_percent=float(grammar_percent),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
