"""
Prepare grammar corrector model for local use.
This script downloads the model and saves it locally.
"""

import os
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM


def setup_grammar_models():
    print("🔄 Setting up grammar corrector model...")

    CORRECTOR_DIR = "grammar_corrector"
    CORRECTOR_MODEL = "vennify/t5-base-grammar-correction"

    os.makedirs(CORRECTOR_DIR, exist_ok=True)

    try:
        print("📥 Downloading grammar corrector...")
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
