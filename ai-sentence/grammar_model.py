import random
import re
import difflib
import torch

from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# =========================================================
# DEVICE
# =========================================================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Device:", device)

# =========================================================
# CONFIG
# =========================================================
CORRECTOR_DIR = "grammar_corrector"
MAX_LEN = 192
HIGH_THRESHOLD = 0.90
LOW_THRESHOLD = 0.60
MAX_NEW_TOKENS = 48
NUM_BEAMS = 4

# =========================================================
# LOAD CORRECTOR
# =========================================================
corrector_tokenizer = AutoTokenizer.from_pretrained(CORRECTOR_DIR)
corrector_model = AutoModelForSeq2SeqLM.from_pretrained(CORRECTOR_DIR).to(device)
corrector_model.eval()

# =========================================================
# EXAMPLES
# =========================================================
EXAMPLES = [
    "She goes to school every day.",
    "He plays football every weekend.",
    "I have finished my homework.",
    "They are studying together.",
]

# =========================================================
# HELPERS
# =========================================================

def get_example():
    return random.choice(EXAMPLES)


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


def similarity_score(a, b):
    return difflib.SequenceMatcher(None, a, b).ratio()


def infer_scores(original, corrected):
    similarity = similarity_score(original, corrected)
    original_score = round(max(0.15, min(0.95, 0.15 + similarity * 0.8)), 4)
    corrected_score = 0.95 if corrected != original else original_score
    return original_score, corrected_score


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
def generate_feedback(original, corrected, original_score, corrected_score):
    original_lower = original.lower()
    corrected_lower = corrected.lower()

    if original_lower == corrected_lower:
        if original_score >= HIGH_THRESHOLD:
            return "Kalimat sudah grammatical dan natural."
        return "Kalimat hampir benar, tetapi masih bisa diperbaiki."

    if corrected_score > original_score + 0.05:
        return "Grammar berhasil diperbaiki ke bentuk yang lebih natural."
    if corrected_score > original_score:
        return "Kalimat sedikit membaik setelah koreksi."
    return "Koreksi tidak meningkatkan grammar secara signifikan."


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

    if original_score >= HIGH_THRESHOLD:
        status = "grammatical"
    elif corrected_score > original_score:
        status = "ungrammatical"
    else:
        status = "borderline"

    final_confidence = max(original_score, corrected_score)
    result = {
        "status": status,
        "input_sentence": sentence,
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
        ),
        "original_score": round(original_score, 4),
        "corrected_score": round(corrected_score, 4),
        "example_sentence": "",
    }
    if status != "grammatical":
        result["example_sentence"] = get_example()

    return result
