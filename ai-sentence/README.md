# AI Sentence - Grammar Checker API

Folder `ai-sentence` contains a Flask API for grammar scoring and correction using transformer models.

## Files

- `app.py` - Flask API entrypoint, exposes `/check-grammar` endpoint
- `grammar_model.py` - Grammar correction pipeline
- `prepare_grammar_models.py` - Script to download and setup the corrector model locally
- `requirements.txt` - Python dependencies
- `grammar_corrector/` - Local correction model (auto-generated, not in git)

## Setup

### Prerequisites

- Python 3.8+
- Pip

### Installation

1. **Install dependencies** (from the `ai-sentence` folder):

```bash
python -m pip install -r requirements.txt
```

If you get a PyTorch install error on Windows, run:

```bash
python -m pip install -r requirements.txt
```

2. **Prepare models** (downloads ~500MB from Hugging Face):

```bash
python prepare_grammar_models.py
```

This will:
- Download the grammar classifier model
- Download the T5 corrector model
- Create `grammar_classifier/` directory
- Generate `grammar_classifier_meta.json`

> **Important:** The first run may take 2-5 minutes depending on your internet speed.

### Running the Service

```bash
python app.py
```

The Flask app listens on:
- `http://0.0.0.0:5002/`
- `http://0.0.0.0:5002/check-grammar` (POST endpoint)

## API Usage

### POST `/check-grammar`

**Request:**
```json
{
  "sentence": "She go to school."
}
```

**Response:**
```json
{
  "status": "ungrammatical",
  "input_sentence": "She go to school.",
  "grammar_score": 0.2345,
  "corrected_sentence": "She goes to school.",
  "confidence": 0.9876,
  "writing_level": "Good",
  "writing_quality": "Bagus",
  "feedback": "Grammar berhasil diperbaiki ke bentuk yang lebih natural.",
  "original_score": 0.2345,
  "corrected_score": 0.9876,
  "example_sentence": "She goes to school every day."
}
```

### Testing with cURL

```bash
curl -X POST http://localhost:5002/check-grammar \
  -H "Content-Type: application/json" \
  -d '{"sentence":"She go to school."}'
```

## Environment Variables

Set in a `.env` file or shell:

```
FLASK_ENV=development
FLASK_DEBUG=1
```

## GPU Support

By default, models run on **CPU**. To use GPU (if available):

Edit `grammar_model.py`:
```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
```

## Dependencies

- **flask** - Web framework
- **flask-cors** - CORS support for React frontend
- **torch** - Deep learning framework
- **transformers** - Hugging Face model library
- **protobuf** - Protocol buffer serialization
- **tiktoken** - OpenAI tokenizer library

## Notes

- Models are auto-downloaded from Hugging Face on first run
- Classifier: Fine-tuned grammar classification model
- Corrector: T5-base model for grammar correction
- CPU-only for better compatibility; GPU optional

## Troubleshooting

**"No module named 'transformers'"**
```bash
pip install transformers torch
```

**"Connection timeout when downloading models"**
- Check your internet connection
- Models may be cached after first download

**Port 5002 already in use**
- Edit `app.py` and change port, or kill the process using that port
