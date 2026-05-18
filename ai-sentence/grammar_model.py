import re
import difflib
from pathlib import Path

import torch
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    AutoModelForSequenceClassification,
)

# =========================================================
# CONFIG
# =========================================================
BASE_DIR = Path(__file__).resolve().parent
CLASSIFIER_DIR = BASE_DIR / "grammar_classifier"
CORRECTOR_DIR = BASE_DIR / "grammar_corrector"
MAX_LEN = 192
ACCEPTABILITY_THRESHOLD = 0.75
HIGH_THRESHOLD = 0.90
LOW_THRESHOLD = 0.60
MAX_NEW_TOKENS = 48
NUM_BEAMS = 4

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

_classifier_tokenizer = None
_classifier_model = None
_corrector_tokenizer = None
_corrector_model = None
_models_ready = False
_models_error = None


def _load_models():
    global _classifier_tokenizer, _classifier_model
    global _corrector_tokenizer, _corrector_model
    global _models_ready, _models_error

    if _models_ready:
        return
    if _models_error:
        raise RuntimeError(_models_error)

    if not CLASSIFIER_DIR.is_dir() or not CORRECTOR_DIR.is_dir():
        _models_error = (
            "Model belum tersedia. Jalankan: python prepare_grammar_models.py"
        )
        raise RuntimeError(_models_error)

    try:
        print("Loading CoLA classifier from", CLASSIFIER_DIR)
        _classifier_tokenizer = AutoTokenizer.from_pretrained(CLASSIFIER_DIR)
        _classifier_model = AutoModelForSequenceClassification.from_pretrained(
            CLASSIFIER_DIR
        ).to(device)
        _classifier_model.eval()

        print("Loading grammar corrector from", CORRECTOR_DIR)
        _corrector_tokenizer = AutoTokenizer.from_pretrained(CORRECTOR_DIR)
        _corrector_model = AutoModelForSeq2SeqLM.from_pretrained(CORRECTOR_DIR).to(
            device
        )
        _corrector_model.eval()

        _models_ready = True
        print("Device:", device)
    except Exception as exc:
        _models_error = str(exc)
        raise


# =========================================================
# HELPERS
# =========================================================
def score_to_level(score):
    if score >= 0.90:
        return "Excellent"
    if score >= 0.75:
        return "Good"
    if score >= 0.55:
        return "Fair"
    return "Needs Improvement"


def writing_quality(score):
    if score >= 0.75:
        return "Bagus"
    if score >= 0.55:
        return "Cukup"
    return "Perlu perbaikan"


def clean_text(text):
    text = text.strip()
    text = re.sub(
        r"^(grammar|correction|corrected text)\s*:\s*", "", text, flags=re.IGNORECASE
    )
    text = re.sub(r"\s+", " ", text)
    return (
        text.replace(" ,", ",")
        .replace(" .", ".")
        .replace(" !", "!")
        .replace(" ?", "?")
    ).strip()


def looks_bad_output(src, out):
    if not out:
        return True
    if len(out.split()) < max(1, len(src.split()) // 3):
        return True
    if len(out) > max(160, int(len(src) * 2.5)):
        return True
    return False


def tokenize_with_spans(text):
    spans = []
    for match in re.finditer(r"\w+|[^\w\s]", text):
        spans.append(
            {
                "token": match.group(),
                "start": match.start(),
                "end": match.end(),
            }
        )
    return spans


def guess_grammar_category(original_span, corrected_span, op):
    combined = f"{original_span} {corrected_span}".lower()
    if op == "insert" and corrected_span.lower() in {"a", "an", "the"}:
        return "article"
    if op == "replace" and original_span.endswith("s") != corrected_span.endswith("s"):
        return "verb_form"
    if any(word in combined for word in ("is", "are", "was", "were", "be", "been")):
        return "verb_tense"
    if op == "insert":
        return "missing_word"
    if op == "delete":
        return "extra_word"
    return "grammar"


def extract_error_spans(original, corrected):
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
            original_spans[i2 - 1]["end"] if i2 > i1 and i2 <= len(original_spans) else highlight_start
        )

        errors.append(
            {
                "type": error_type,
                "grammar_category": guess_grammar_category(
                    original_span, corrected_span, tag
                ),
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


# =========================================================
# CoLA — acceptability scoring
# =========================================================
def predict_acceptability(sentence):
    _load_models()
    inputs = _classifier_tokenizer(
        sentence,
        return_tensors="pt",
        truncation=True,
        max_length=128,
        padding=True,
    ).to(device)
    with torch.no_grad():
        outputs = _classifier_model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)
        return probs[:, 1].item()


def score_acceptability(sentence):
    score = predict_acceptability(sentence)
    rounded = round(score, 4)
    if rounded >= HIGH_THRESHOLD:
        status = "acceptable"
    elif rounded <= LOW_THRESHOLD:
        status = "unacceptable"
    else:
        status = "borderline"
    return {
        "acceptability_score": rounded,
        "is_acceptable": rounded >= ACCEPTABILITY_THRESHOLD,
        "status": status,
    }


# =========================================================
# T5 — grammar correction
# =========================================================
def generate_correction(sentence):
    _load_models()
    inputs = _corrector_tokenizer(
        f"grammar: {sentence}",
        return_tensors="pt",
        truncation=True,
        max_length=MAX_LEN,
    ).to(device)
    with torch.no_grad():
        outputs = _corrector_model.generate(
            **inputs,
            max_new_tokens=MAX_NEW_TOKENS,
            num_beams=NUM_BEAMS,
            do_sample=False,
        )
    decoded = _corrector_tokenizer.decode(outputs[0], skip_special_tokens=True)
    decoded = clean_text(decoded)
    if looks_bad_output(sentence, decoded):
        return sentence
    return decoded


# =========================================================
# Feedback (CoLA score + diff explanation)
# =========================================================
def generate_feedback(original, corrected, original_score, corrected_score, errors):
    if original.lower() == corrected.lower():
        if original_score >= HIGH_THRESHOLD:
            return "The sentence is grammatically acceptable."
        return "The sentence is almost correct but can still be improved."

    if errors:
        lead = errors[0]["message"]
        if corrected_score > original_score:
            return f"Suggested fix: {lead}"
        return f"Check this: {lead}"

    if corrected_score > original_score + 0.05:
        return "Grammar was improved to a more natural form."
    if corrected_score > original_score:
        return "The sentence improved slightly after correction."
    return "Correction did not significantly improve the sentence."


# =========================================================
# Combined pipeline: CoLA + corrector + diff
# =========================================================
def grammar_pipeline(sentence, mode="grade"):
    """
    mode:
      - "grade": full response (CoLA score + correction + errors)
      - "assist": correction + errors + feedback only (no scores)
    """
    sentence = str(sentence).strip()
    if not sentence:
        return {"status": "empty", "message": "Input is empty."}

    try:
        _load_models()
    except RuntimeError as exc:
        return {"status": "error", "message": str(exc)}

    # 1) Grammar correction (T5)
    corrected_text = generate_correction(sentence)

    # 2) Diff / error explanation
    errors = extract_error_spans(sentence, corrected_text)
    has_changes = sentence.lower() != corrected_text.lower()

    # 3) CoLA acceptability (input + corrected)
    original_score = round(predict_acceptability(sentence), 4)
    corrected_score = round(predict_acceptability(corrected_text), 4)
    acceptability = score_acceptability(sentence)

    feedback = generate_feedback(
        sentence,
        corrected_text,
        original_score,
        corrected_score,
        errors,
    )

    final_confidence = max(original_score, corrected_score)

    result = {
        "input_sentence": sentence,
        "corrected_sentence": corrected_text,
        "errors": errors,
        "error_spans": errors,
        "has_grammar_errors": bool(errors),
        "sentence_changed": has_changes,
        "feedback": feedback,
    }

    if mode == "assist":
        return result

    result.update(
        {
            "status": acceptability["status"],
            "acceptability_score": acceptability["acceptability_score"],
            "is_acceptable": acceptability["is_acceptable"],
            "grammar_score": acceptability["acceptability_score"],
            "confidence": round(final_confidence, 4),
            "writing_level": score_to_level(final_confidence),
            "writing_quality": writing_quality(final_confidence),
            "original_score": original_score,
            "corrected_score": corrected_score,
        }
    )
    return result
