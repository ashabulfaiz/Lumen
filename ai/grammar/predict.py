#!/usr/bin/env python3
"""CLI inference for the grammar acceptability TensorFlow model."""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from src.inference import get_predictor


def main():
    parser = argparse.ArgumentParser(description="Grammar acceptability inference")
    parser.add_argument("sentence", nargs="?", help="Sentence to score")
    parser.add_argument("--file", help="Text file with one sentence per line")
    args = parser.parse_args()

    predictor = get_predictor()

    if args.file:
        path = Path(args.file)
        sentences = [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
        results = [predictor.predict(s).to_api_dict() for s in sentences]
        print(json.dumps(results, indent=2, ensure_ascii=False))
        return

    if not args.sentence:
        parser.error("Provide a sentence or --file")

    result = predictor.predict(args.sentence)
    print(json.dumps(result.to_api_dict(), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
