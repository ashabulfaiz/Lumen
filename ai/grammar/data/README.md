# Dataset (CoLA + JFLEG)

**Sudah punya CSV dari tim Data Science?** Cukup letakkan di folder ini — tidak perlu generate ulang.

```
data/
  cola/
    train.csv    ← wajib
    val.csv      ← opsional
    test.csv     ← wajib (evaluasi)
  jfleg/
    train.csv    ← wajib
    val.csv      ← opsional
    test.csv     ← wajib
```

Lalu jalankan training:

```bash
python -m src.train
# atau
bash scripts/run_pipeline.sh
```

Pipeline **otomatis memakai file yang ada** di `data/`. Sample data hanya dibuat jika `train.csv` belum ada.

---

## CoLA (`cola/`)

Skor acceptability grammar (binary).

| File | Wajib | Kolom |
|------|-------|-------|
| `train.csv` | Ya | `sentence`, `label` |
| `val.csv` | Opsional* | sama |
| `test.csv` | Ya | sama |

- `label`: `0` = unacceptable, `1` = acceptable
- `acceptability_score` (opsional): float 0–1; jika kosong, diisi dari `label`
- `difficulty` (opsional): `beginner` | `intermediate` | `advanced`

## JFLEG (`jfleg/`)

Pasangan kalimat salah vs koreksi.

| File | Wajib | Kolom |
|------|-------|-------|
| `train.csv` | Ya | `flawed_sentence`, `corrected_sentence` |
| `val.csv` | Opsional* | sama |
| `test.csv` | Ya | sama |

Kolom opsional: `acceptability_score_flawed`, `acceptability_score_corrected`, `difficulty_flawed`, `difficulty_corrected`

\* Jika `val.csv` tidak ada, validasi diambil dari proporsi train (`VAL_SPLIT` di `src/config.py`).

## Contoh baris

**cola/train.csv**
```csv
sentence,label,acceptability_score,difficulty
She goes to school every day.,1,0.98,advanced
She go to school every day.,0,0.12,beginner
```

**jfleg/train.csv**
```csv
flawed_sentence,corrected_sentence
He go to store.,He goes to the store.
```

## Sample data (hanya development)

Jika folder `data/` masih kosong:

```bash
python scripts/generate_sample_data.py
```

Setelah CSV tim DS siap, **ganti** file di `cola/` dan `jfleg/` — nama kolom tetap sama.
