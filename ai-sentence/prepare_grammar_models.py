"""
Prepare grammar models for local use.
This script downloads the CoLA classifier and JFLEG corrector model locally.
"""

import os
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, AutoModelForSequenceClassification


def setup_grammar_models():
    print("🔄 Setting up grammar models...")

    CORRECTOR_DIR = "grammar_corrector"
    CLASSIFIER_DIR = "grammar_classifier"
    CORRECTOR_MODEL = "vennify/t5-base-grammar-correction"
    CLASSIFIER_MODEL = "textattack/bert-base-uncased-CoLA"

    os.makedirs(CORRECTOR_DIR, exist_ok=True)
    os.makedirs(CLASSIFIER_DIR, exist_ok=True)

    try:
        print("📥 Downloading CoLA classifier...")
        classifier_tokenizer = AutoTokenizer.from_pretrained(CLASSIFIER_MODEL)
        classifier_model = AutoModelForSequenceClassification.from_pretrained(CLASSIFIER_MODEL)
        classifier_tokenizer.save_pretrained(CLASSIFIER_DIR)
        classifier_model.save_pretrained(CLASSIFIER_DIR)
        print(f"✅ Classifier saved to {CLASSIFIER_DIR}/")

        print("\n📥 Downloading grammar corrector...")
        tokenizer = AutoTokenizer.from_pretrained(CORRECTOR_MODEL)
        model = AutoModelForSeq2SeqLM.from_pretrained(CORRECTOR_MODEL)
        tokenizer.save_pretrained(CORRECTOR_DIR)
        model.save_pretrained(CORRECTOR_DIR)
        print(f"✅ Corrector saved to {CORRECTOR_DIR}/")

        print("\n✨ Setup complete! You can now run: python app.py")

    except Exception as e:
        print(f"❌ Error during setup: {e}")
        raise


if __name__ == "__main__":
    setup_grammar_models()
