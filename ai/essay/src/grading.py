"""Score essays on grammar, vocabulary, relevance, and coherence."""
from __future__ import annotations

import re
from typing import Any

from rubric import (
    DIMENSION_KEYS,
    band_for_score,
    dimension_meta,
    load_rubric,
    pass_threshold,
    weighted_overall,
)

_STOPWORDS = frozenset(
    """
    a an the is are was were be been being am do does did have has had
    i you he she it we they my your his her its our their this that these
    those what where who when why how of in on at to for with from and or
    but so if not can will would should could about into than then also
    write writing read reading listen listening text audio conversation
    sentences sentence paragraph short simple words things thing using use
    """.split()
)

_CONNECTORS = frozenset(
    """
    and but because so therefore however moreover furthermore first second
    then finally also besides although while whereas in addition for example
    such as on the other hand in conclusion
    """.split()
)

_MIN_CHARS = {"beginner": 40, "intermediate": 80, "advanced": 120}


def _tokens(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z']+", text.lower())


def _content_tokens(text: str) -> set[str]:
    return {t for t in _tokens(text) if t not in _STOPWORDS and len(t) > 2}


def _sentences(text: str) -> list[str]:
    parts = re.split(r"[.!?]+", text)
    return [p.strip() for p in parts if p.strip()]


# --- Semantic relevance ------------------------------------------------------
# NOTE (earlier bug): relevance was lexical only — a bag-of-words overlap between
# prompt and answer. It mis-scored on-topic answers that used different words, and
# the old reading/listening prompts ("the text" / "the audio") had their key words
# in the stopword list, so overlap was ~0. We now compare *meaning* with a sentence
# embedding model when available, and fall back to lexical overlap if it is not.

_SEMANTIC_MODEL = None
_SEMANTIC_OFF = False


def _semantic_model():
    global _SEMANTIC_MODEL, _SEMANTIC_OFF
    if _SEMANTIC_OFF:
        return None
    if _SEMANTIC_MODEL is None:
        try:
            from sentence_transformers import SentenceTransformer

            _SEMANTIC_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception:
            _SEMANTIC_OFF = True  # optional dependency or model download unavailable
            return None
    return _SEMANTIC_MODEL


def semantic_similarity(question: str, answer: str) -> float | None:
    """Cosine similarity of prompt vs answer meaning in [0, 1]; None if unavailable."""
    model = _semantic_model()
    if model is None:
        return None
    try:
        import numpy as np

        emb = model.encode([question, answer], normalize_embeddings=True)
        return max(0.0, min(1.0, float(np.dot(emb[0], emb[1]))))
    except Exception:
        return None


def score_vocabulary(answer: str, level: str) -> tuple[float, str]:
    words = _tokens(answer)
    if not words:
        return 0.0, "Add more words to show your vocabulary range."

    unique_ratio = len(set(words)) / len(words)
    long_words = sum(1 for w in words if len(w) >= 6)
    min_words = {"beginner": 15, "intermediate": 25, "advanced": 40}.get(level, 20)

    score = 35.0
    score += min(25, (len(words) / min_words) * 25)
    score += unique_ratio * 25
    score += min(15, long_words * 3)
    score = min(100.0, score)

    if unique_ratio < 0.45:
        feedback = "Try using more varied words and avoid repeating the same terms."
    elif len(words) < min_words:
        feedback = "Good start — add a few more words to fully develop your ideas."
    else:
        feedback = "Good vocabulary range for this level."

    return round(score, 1), feedback


def score_relevance(question: str, answer: str, level: str) -> tuple[float, str]:
    q_tokens = _content_tokens(question)
    a_tokens = _content_tokens(answer)
    min_chars = _MIN_CHARS.get(level, 60)

    if not answer.strip():
        return 0.0, "Your answer is empty. Address the prompt directly."

    length_score = min(40.0, (len(answer) / min_chars) * 40)

    lexical = len(q_tokens & a_tokens) / len(q_tokens) if q_tokens else 0.0

    # Prefer semantic similarity (understands meaning/synonyms); blend the lexical
    # overlap as a floor so it still works when the embedding model is absent.
    semantic = semantic_similarity(question, answer)
    relevance_ratio = (0.7 * semantic + 0.3 * lexical) if semantic is not None else lexical

    overlap_score = relevance_ratio * 45
    structure_score = 15.0 if len(answer.strip()) >= min_chars * 0.5 else 5.0

    score = min(100.0, length_score + overlap_score + structure_score)

    if len(answer) < min_chars * 0.4:
        feedback = "Expand your answer so it clearly responds to the prompt."
    elif relevance_ratio < 0.15:
        feedback = "Stay closer to the topic in the question."
    else:
        feedback = "Your answer addresses the prompt."

    return round(score, 1), feedback


def score_coherence(answer: str, level: str) -> tuple[float, str]:
    sents = _sentences(answer)
    words = _tokens(answer)
    if not words:
        return 0.0, "Write full sentences so your ideas flow clearly."

    expected_sents = {"beginner": 2, "intermediate": 3, "advanced": 4}.get(level, 3)
    sent_score = min(35.0, (len(sents) / expected_sents) * 35)

    lower = answer.lower()
    connector_hits = sum(1 for c in _CONNECTORS if f" {c} " in f" {lower} ")
    link_score = min(25.0, connector_hits * 8)

    punct_score = 15.0 if re.search(r"[.!?]", answer) else 5.0
    avg_len = len(words) / max(len(sents), 1)
    flow_score = 25.0 if 6 <= avg_len <= 22 else 12.0

    score = min(100.0, sent_score + link_score + punct_score + flow_score)

    if len(sents) < 2:
        feedback = "Use more than one sentence and connect your ideas."
    elif connector_hits == 0 and level != "beginner":
        feedback = "Add linking words (e.g. because, however, first) to improve flow."
    else:
        feedback = "Ideas are organized in a readable way."

    return round(score, 1), feedback


def grade_essay(
    *,
    question: str,
    answer: str,
    level: str = "beginner",
    grammar_score_percent: float | None = None,
) -> dict[str, Any]:
    """
    Build rubric breakdown. Grammar comes from the TensorFlow pipeline when provided.
    """
    level_slug = level.strip().lower()
    if level_slug in ("1", "bgn"):
        level_slug = "beginner"
    elif level_slug in ("2", "int"):
        level_slug = "intermediate"
    elif level_slug in ("3", "adv"):
        level_slug = "advanced"

    grammar = float(grammar_score_percent) if grammar_score_percent is not None else 50.0
    grammar = max(0.0, min(100.0, grammar))

    vocab, vocab_fb = score_vocabulary(answer, level_slug)
    relevance, rel_fb = score_relevance(question, answer, level_slug)
    coherence, coh_fb = score_coherence(answer, level_slug)

    scores = {
        "grammar": round(grammar, 1),
        "vocabulary": vocab,
        "relevance": relevance,
        "coherence": coherence,
    }

    dimensions: dict[str, Any] = {}
    feedback_parts: list[str] = []
    grammar_fb = (
        "Strong grammar control."
        if grammar >= 85
        else "Some grammar issues — check the suggested corrections."
        if grammar >= 60
        else "Focus on basic sentence structure and verb forms."
    )
    dim_feedback = {
        "grammar": grammar_fb,
        "vocabulary": vocab_fb,
        "relevance": rel_fb,
        "coherence": coh_fb,
    }

    rubric = load_rubric()
    for key in DIMENSION_KEYS:
        s = scores[key]
        band = band_for_score(key, s)
        dim = rubric["dimensions"][key]
        dimensions[key] = {
            "score": s,
            "weight": dim["weight"],
            "label": dim["label"],
            "band": band["label"],
            "criteria": band["criteria"],
            "feedback": dim_feedback[key],
        }
        feedback_parts.append(f"{dim['label']}: {dim_feedback[key]}")

    overall = weighted_overall(scores)
    passed = overall >= pass_threshold()

    return {
        "status": "ok",
        "level": level_slug,
        "scores": scores,
        "dimensions": dimensions,
        "overall_score": overall,
        "pass_threshold": pass_threshold(),
        "passed": passed,
        "feedback": " ".join(feedback_parts),
        "rubric": {
            "version": rubric.get("version"),
            "pass_threshold": pass_threshold(),
            "dimensions": dimension_meta(),
        },
    }
