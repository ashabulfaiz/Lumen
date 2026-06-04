# Grammar training data

A small set of CSVs is committed here so training works out of the box. To train on the team's full DS‑cleaned dataset, replace these files (keep the same columns). Training reads them directly when `train.csv` exists in **both** `cola/` and `jfleg/`.

```
ai/grammar/data/
├── cola/    train.csv  val.csv  test.csv
└── jfleg/   train.csv  val.csv  test.csv
```

If a folder is empty, generate sample data with `python scripts/generate_sample_data.py` (run from `ai/grammar/`) before training.

---

## `cola/` — acceptability labels

Files: `train.csv`, `val.csv`, `test.csv`

| Column | Type | Description |
|--------|------|-------------|
| `sentence` | string | Input sentence |
| `label` | int | `1` = acceptable, `0` = not acceptable |
| `acceptability_score` | float *(optional)* | Target score in `[0, 1]`; derived from `label` if omitted |

---

## `jfleg/` — flawed vs corrected pairs

Files: `train.csv`, `val.csv`, `test.csv`

| Column | Type | Description |
|--------|------|-------------|
| `flawed_sentence` | string | Incorrect sentence |
| `corrected_sentence` | string | Reference correction |
| `acceptability_score_flawed` | float *(optional)* | Defaults to ~`0.1` for flawed rows |
| `acceptability_score_corrected` | float *(optional)* | Defaults to ~`0.95` for corrected rows |

Each JFLEG row expands into **two** training examples (the flawed sentence and its correction).

---

See the [AI services README](../../README.md#training-the-grammar-model) for the full training and evaluation steps (works on Windows, macOS, and Linux).
