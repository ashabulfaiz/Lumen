"""Central configuration for grammar acceptability TensorFlow pipeline."""
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Local datasets (cleaned by Data Science team)
DATA_DIR = BASE_DIR / "data"
COLA_DIR = DATA_DIR / "cola"
JFLEG_DIR = DATA_DIR / "jfleg"

# Artifacts
MODELS_DIR = BASE_DIR / "models"
EXPORT_KERAS = MODELS_DIR / "grammar_acceptability.keras"
EXPORT_SAVEDMODEL = MODELS_DIR / "saved_model"
VOCAB_PATH = MODELS_DIR / "vocabulary.json"
VECTORIZER_CONFIG = MODELS_DIR / "vectorizer_config.json"

# Committed to repo (root .gitignore ignores top-level "logs/")
LOGS_DIR = BASE_DIR / "reports" / "tensorboard"
CHECKPOINT_DIR = BASE_DIR / "models" / "checkpoints"
REPORTS_DIR = BASE_DIR / "reports"

# Evaluation outputs (never exposed via inference API / frontend)
EVAL_METRICS_JSON = REPORTS_DIR / "evaluation_metrics.json"
EVAL_SUMMARY_TXT = REPORTS_DIR / "evaluation_summary.txt"
TRAINING_HISTORY_JSON = REPORTS_DIR / "training_history.json"

# Model hyperparameters
MAX_SEQUENCE_LENGTH = 128
VOCAB_SIZE = 12000
EMBEDDING_DIM = 192
HIDDEN_UNITS = 128
DROPOUT_RATE = 0.25

# Training
BATCH_SIZE = 64
EPOCHS = 30
LEARNING_RATE = 1e-3
VAL_SPLIT = 0.15
RANDOM_SEED = 42

# Rubric thresholds (checked in evaluate.py only)
MIN_ACCURACY = 0.85
MAX_MAE = 0.02
ACCEPTABILITY_THRESHOLD = 0.75
HIGH_THRESHOLD = 0.90
LOW_THRESHOLD = 0.55

# Loss weights (classification + regression)
CLASSIFICATION_WEIGHT = 0.3
REGRESSION_WEIGHT = 0.7

# Writing level thresholds (inference → Beginner / Intermediate / Advanced)
LEVEL_ADVANCED_MIN = 0.85
LEVEL_INTERMEDIATE_MIN = 0.60

# API (default port matches previous ai-sentence service for the web app)
API_HOST = "0.0.0.0"
API_PORT = 5003
