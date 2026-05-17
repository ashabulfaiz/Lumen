"""
services/level_recommender.py
==============================
Menentukan apakah seorang siswa siap naik level menggunakan
pendekatan HYBRID:
  - Rule-Based  : Syarat minimum yang harus selalu dipenuhi
  - ML          : Scikit-learn (Logistic Regression) untuk prediksi
                  probabilitas kesiapan naik level

Alur logika:
  1. Ambil data progress & skor siswa dari database
  2. Rule check: apakah syarat minimum terpenuhi?
  3. Jika lolos rule → ML model prediksi probabilitas
  4. Gabungkan hasilnya menjadi rekomendasi final

Catatan:
  - ML model dilatih secara in-memory dari data historis semua siswa.
  - Karena data awal mungkin sedikit, fallback ke rule-based tersedia.
"""

import numpy as np
from utils.db import query

# ----------------------------------------------------------------
# Konstanta Aturan (Rule-Based Threshold)
# ----------------------------------------------------------------
SKOR_MINIMUM         = 70.0   # rata-rata skor quiz harus >= ini
MATERI_MINIMUM_PCT   = 0.75   # minimal 75% materi level harus selesai
QUIZ_MINIMUM         = 3      # minimal sudah kerjakan 3 kuis di level ini
PROBA_NAIK_THRESHOLD = 0.60   # ML: probabilitas >= 60% dianggap siap naik


# ----------------------------------------------------------------
# Fungsi utama
# ----------------------------------------------------------------
def recommend_level(user_id: int) -> dict:
    """
    Mengembalikan rekomendasi level untuk siswa.
    Output: dict berisi level saat ini, rekomendasi, skor kelayakan,
            alasan, dan apakah siap naik level.
    """

    # 1. Ambil level saat ini dari profil user
    user_rows = query(
        "SELECT current_level FROM users WHERE id = %s", (user_id,)
    )
    if not user_rows:
        return _not_found(user_id)

    level_saat_ini = user_rows[0]["current_level"]  # Beginner / Intermediate / Advanced

    # Jika sudah Advanced, tidak ada level lebih tinggi
    if level_saat_ini == "Advanced":
        return {
            "user_id"         : user_id,
            "level_saat_ini"  : "Advanced",
            "level_rekomendasi": "Advanced",
            "siap_naik_level" : False,
            "skor_kelayakan"  : 100.0,
            "metode"          : "rule",
            "alasan"          : "Anda sudah berada di level tertinggi. Pertahankan!"
        }

    # 2. Cari level_id yang sesuai dengan level saat ini
    level_rows = query(
        "SELECT id FROM levels WHERE nama_level = %s LIMIT 1", (level_saat_ini,)
    )
    if not level_rows:
        return _level_not_configured(user_id, level_saat_ini)

    level_id = level_rows[0]["id"]

    # 3. Ambil data skor kuis siswa di level ini
    scores_rows = query("""
        SELECT qs.skor
        FROM quiz_scores qs
        JOIN quizzes     q  ON qs.quiz_id  = q.id
        JOIN courses     c  ON q.course_id = c.id
        WHERE qs.user_id = %s AND c.level_id = %s
    """, (user_id, level_id))

    # 4. Ambil data progress materi siswa di level ini
    total_lessons_rows = query("""
        SELECT COUNT(*) AS total
        FROM lessons l
        JOIN courses c ON l.course_id = c.id
        WHERE c.level_id = %s
    """, (level_id,))

    completed_rows = query("""
        SELECT COUNT(*) AS selesai
        FROM user_progress up
        JOIN lessons l ON up.lesson_id = l.id
        JOIN courses c ON l.course_id = c.id
        WHERE up.user_id = %s AND c.level_id = %s AND up.is_completed = TRUE
    """, (user_id, level_id))

    total_lessons = total_lessons_rows[0]["total"] if total_lessons_rows else 0
    selesai       = completed_rows[0]["selesai"]   if completed_rows      else 0

    # 5. Hitung fitur
    semua_skor  = [float(r["skor"]) for r in scores_rows]
    rata_skor   = round(sum(semua_skor) / len(semua_skor), 2) if semua_skor else 0.0
    total_quiz  = len(semua_skor)
    pct_materi  = round(selesai / total_lessons, 4) if total_lessons > 0 else 0.0

    # 6. Rule-Based Check
    rule_lulus, alasan_rule = _check_rules(rata_skor, total_quiz, pct_materi)

    # 7. ML Prediction (jika ada cukup data historis)
    ml_proba  = None
    ml_lulus  = None
    metode    = "rule"

    if total_quiz >= QUIZ_MINIMUM:
        ml_proba = _ml_predict_proba(user_id, level_id, rata_skor, pct_materi, total_quiz)
        if ml_proba is not None:
            ml_lulus = ml_proba >= PROBA_NAIK_THRESHOLD
            metode = "hybrid"

    # 8. Keputusan final: KEDUA kondisi (rule + ML) harus setuju untuk naik level
    if metode == "hybrid":
        siap_naik = rule_lulus and ml_lulus
        skor_kelayakan = round((rata_skor * 0.5) + (ml_proba * 50), 2)
    else:
        siap_naik = rule_lulus
        skor_kelayakan = round(rata_skor, 2)

    level_rekomendasi = _next_level(level_saat_ini) if siap_naik else level_saat_ini

    alasan = _build_reason(
        siap_naik, rata_skor, total_quiz, pct_materi,
        ml_proba, rule_lulus, alasan_rule
    )

    return {
        "user_id"           : user_id,
        "level_saat_ini"    : level_saat_ini,
        "level_rekomendasi" : level_rekomendasi,
        "siap_naik_level"   : siap_naik,
        "skor_kelayakan"    : skor_kelayakan,
        "detail": {
            "rata_rata_skor"      : rata_skor,
            "total_quiz_dikerjakan": total_quiz,
            "persen_materi_selesai": round(pct_materi * 100, 1),
            "ml_probabilitas_siap" : round(ml_proba * 100, 1) if ml_proba is not None else None,
        },
        "metode" : metode,
        "alasan" : alasan,
    }


# ----------------------------------------------------------------
# Rule-Based Checker
# ----------------------------------------------------------------
def _check_rules(rata_skor: float, total_quiz: int, pct_materi: float):
    """Kembalikan (lulus: bool, alasan: str)."""
    if total_quiz < QUIZ_MINIMUM:
        return False, f"Belum mengerjakan cukup kuis (minimal {QUIZ_MINIMUM}, baru {total_quiz})."
    if rata_skor < SKOR_MINIMUM:
        return False, f"Rata-rata skor {rata_skor} belum memenuhi minimum {SKOR_MINIMUM}."
    if pct_materi < MATERI_MINIMUM_PCT:
        return False, f"Materi yang diselesaikan {pct_materi*100:.0f}% (minimal {MATERI_MINIMUM_PCT*100:.0f}%)."
    return True, "Semua syarat minimum terpenuhi."


# ----------------------------------------------------------------
# ML Prediction (Logistic Regression — dilatih dari data historis)
# ----------------------------------------------------------------
def _ml_predict_proba(user_id, level_id, rata_skor, pct_materi, total_quiz):
    """
    Latih model Logistic Regression dari data historis semua siswa
    lalu prediksi probabilitas user ini siap naik level.
    Mengembalikan float (0.0-1.0) atau None jika data tidak cukup.
    """
    try:
        from sklearn.linear_model import LogisticRegression
        from sklearn.preprocessing import StandardScaler

        # Ambil data historis: siswa yang sudah pernah naik level (label=1)
        # vs yang belum (label=0), berdasarkan quiz_scores & user_progress
        historis = query("""
            SELECT
                u.id AS user_id,
                AVG(qs.skor) AS rata_skor,
                COUNT(qs.id) AS total_quiz,
                CASE WHEN u.current_level != 'Beginner' THEN 1 ELSE 0 END AS pernah_naik
            FROM users u
            LEFT JOIN quiz_scores qs ON u.id = qs.user_id
            GROUP BY u.id
            HAVING COUNT(qs.id) >= %s
        """, (QUIZ_MINIMUM,))

        # Butuh minimal 6 data historis agar model masuk akal
        if len(historis) < 6:
            return None

        X = np.array([
            [float(r["rata_skor"]), int(r["total_quiz"])]
            for r in historis
        ])
        y = np.array([int(r["pernah_naik"]) for r in historis])

        # Jika semua label sama (semua 0 atau semua 1), model tidak bisa belajar
        if len(set(y)) < 2:
            return None

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        model = LogisticRegression(max_iter=500)
        model.fit(X_scaled, y)

        # Prediksi untuk user ini
        x_user = scaler.transform([[rata_skor, total_quiz]])
        proba  = model.predict_proba(x_user)[0][1]  # probabilitas kelas 1 (siap naik)

        return float(proba)

    except Exception as e:
        print(f"[DS] ML prediction error: {e}")
        return None


# ----------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------
def _next_level(current: str) -> str:
    urutan = {"Beginner": "Intermediate", "Intermediate": "Advanced"}
    return urutan.get(current, current)


def _build_reason(siap, rata_skor, total_quiz, pct_materi, ml_proba, rule_lulus, alasan_rule):
    if siap:
        bagian = [
            f"Rata-rata skor {rata_skor} sudah memenuhi syarat.",
            f"Materi diselesaikan {pct_materi*100:.0f}%.",
        ]
        if ml_proba is not None:
            bagian.append(f"Model prediksi menunjukkan {ml_proba*100:.0f}% kesiapan naik level.")
        bagian.append("Selamat, Anda siap ke level berikutnya!")
    else:
        bagian = [alasan_rule]
        if ml_proba is not None and ml_proba < PROBA_NAIK_THRESHOLD:
            bagian.append(f"Prediksi model: {ml_proba*100:.0f}% (perlu ≥{PROBA_NAIK_THRESHOLD*100:.0f}%).")
        bagian.append("Teruslah berlatih untuk memenuhi semua syarat.")
    return " ".join(bagian)


def _not_found(user_id):
    return {"user_id": user_id, "error": "User tidak ditemukan."}


def _level_not_configured(user_id, level):
    return {"user_id": user_id, "error": f"Level '{level}' belum dikonfigurasi di database."}
