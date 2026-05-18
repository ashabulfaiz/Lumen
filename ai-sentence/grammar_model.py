import re
import difflib
import torch

from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, AutoModelForSequenceClassification

# =========================================================
# DEVICE
# =========================================================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Device:", device)

# =========================================================
# CONFIG
# =========================================================
CLASSIFIER_DIR = "grammar_classifier"
CORRECTOR_DIR = "grammar_corrector"
MAX_LEN = 192
HIGH_THRESHOLD = 0.90
LOW_THRESHOLD = 0.60
MAX_NEW_TOKENS = 48
NUM_BEAMS = 4

# =========================================================
# LOAD MODELS
# =========================================================
classifier_tokenizer = AutoTokenizer.from_pretrained(CLASSIFIER_DIR)
classifier_model = AutoModelForSequenceClassification.from_pretrained(CLASSIFIER_DIR).to(device)
classifier_model.eval()

corrector_tokenizer = AutoTokenizer.from_pretrained(CORRECTOR_DIR)
corrector_model = AutoModelForSeq2SeqLM.from_pretrained(CORRECTOR_DIR).to(device)
corrector_model.eval()

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
    if len(out.split()) < 2:
        return True
    if len(out) > max(160, int(len(src) * 2.5)):
        return True
    return False


def extract_error_spans(original, corrected):
    original_tokens = re.findall(r"\w+|[^\w\s]", original)
    corrected_tokens = re.findall(r"\w+|[^\w\s]", corrected)
    matcher = difflib.SequenceMatcher(None, original_tokens, corrected_tokens)

    errors = []
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            continue

        original_span = " ".join(original_tokens[i1:i2]).strip()
        corrected_span = " ".join(corrected_tokens[j1:j2]).strip()

        if tag == "replace":
            error_type = "replacement"
            message = f"Ubah '{original_span}' menjadi '{corrected_span}'."
        elif tag == "delete":
            error_type = "deletion"
            message = f"Hapus '{original_span}' dari kalimat."
        elif tag == "insert":
            error_type = "insertion"
            message = f"Tambahkan '{corrected_span}' ke kalimat."
        else:
            error_type = "unknown"
            message = "Perbaiki bagian kalimat ini."

        errors.append({
            "type": error_type,
            "original_span": original_span,
            "corrected_span": corrected_span,
            "message": message,
        })

    return errors


def predict_acceptability(sentence):
    inputs = classifier_tokenizer(
        sentence,
        return_tensors="pt",
        truncation=True,
        max_length=128,
        padding=True,
    ).to(device)
    with torch.no_grad():
        outputs = classifier_model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)
        return probs[:, 1].item()


def infer_scores(original, corrected):
    original_score = predict_acceptability(original)
    corrected_score = predict_acceptability(corrected)
    return round(original_score, 4), round(corrected_score, 4)


# =========================================================
# CORRECTION
# =========================================================
def generate_correction(sentence):
    inputs = corrector_tokenizer(
        f"grammar: {sentence}",
        return_tensors="pt",
        truncation=True,
        max_length=MAX_LEN,
    ).to(device)
    with torch.no_grad():
        outputs = corrector_model.generate(
            **inputs,
            max_new_tokens=MAX_NEW_TOKENS,
            num_beams=NUM_BEAMS,
            do_sample=False,
        )
    decoded = corrector_tokenizer.decode(
        outputs[0],
        skip_special_tokens=True
    )
    decoded = clean_text(decoded)
    if looks_bad_output(sentence, decoded):
        return sentence
    return decoded


# =========================================================
# FEEDBACK
# =========================================================
def generate_feedback(original, corrected, original_score, corrected_score, errors):
    original_lower = original.lower()
    corrected_lower = corrected.lower()

    if original_lower == corrected_lower:
        if original_score >= HIGH_THRESHOLD:
            return "Kalimat sudah grammatical dan natural."
        return "Kalimat hampir benar, tetapi masih bisa diperbaiki."

    if errors:
        if corrected_score > original_score:
            return f"Kalimat diperbaiki. Pertimbangkan: {errors[0]['message']}"
        return f"Perhatikan: {errors[0]['message']}"

    if corrected_score > original_score + 0.05:
        return "Grammar berhasil diperbaiki ke bentuk yang lebih natural."
    if corrected_score > original_score:
        return "Kalimat sedikit membaik setelah koreksi."
    return "Koreksi tidak meningkatkan kualitas kalimat secara signifikan."


# =========================================================
# MAIN PIPELINE
# =========================================================
def grammar_pipeline(sentence):
    sentence = str(sentence).strip()
    if not sentence:
        return {
            "status": "empty",
            "message": "Input kosong."
        }

    corrected_text = generate_correction(sentence)
    original_score, corrected_score = infer_scores(sentence, corrected_text)
    errors = extract_error_spans(sentence, corrected_text)

    if original_score >= HIGH_THRESHOLD:
        status = "acceptable"
    elif original_score <= LOW_THRESHOLD:
        status = "unacceptable"
    else:
        status = "borderline"

    final_confidence = max(original_score, corrected_score)
    result = {
        "status": status,
        "input_sentence": sentence,
        "acceptability_score": round(original_score, 4),
        "is_acceptable": original_score >= HIGH_THRESHOLD,
        "grammar_score": round(original_score, 4),
        "corrected_sentence": corrected_text,
        "confidence": round(final_confidence, 4),
        "writing_level": score_to_level(final_confidence),
        "writing_quality": writing_quality(final_confidence),
        "feedback": generate_feedback(
            sentence,
            corrected_text,
            original_score,
            corrected_score,
            errors,
        ),
        "errors": errors,
        "original_score": round(original_score, 4),
        "corrected_score": round(corrected_score, 4),
    }

    return result
