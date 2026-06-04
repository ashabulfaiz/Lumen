"""
services/performance_service.py
================================
Menganalisis performa belajar siswa berdasarkan data quiz_scores
dan user_progress dari database LUMEN.

Tugas utama:
- Hitung rata-rata skor per level
- Deteksi topik/course yang menjadi kelemahan
- Tentukan tren belajar (meningkat / stabil / menurun)
- Hasilkan rekomendasi teks untuk siswa
"""

from utils.db import query


def get_performance(user_id: int) -> dict:
    """
    Menghasilkan laporan performa lengkap untuk satu siswa.
    """

    # --- 1. Ambil semua riwayat skor kuis modul siswa ---
    # Path join sesuai skema: quiz_scores -> quizzes -> lessons -> courses -> levels.
    # (quizzes terhubung ke lesson_id, bukan course_id; kolom waktu pakai completed_at.)
    scores = query("""
        SELECT
            qs.skor,
            qs.completed_at,
            c.judul_course,
            lv.nama_level
        FROM quiz_scores qs
        JOIN quizzes  q  ON qs.quiz_id  = q.id
        JOIN lessons  l  ON q.lesson_id = l.id
        JOIN courses  c  ON l.course_id = c.id
        JOIN levels   lv ON c.level_id  = lv.id
        WHERE qs.user_id = %s
        ORDER BY qs.completed_at ASC
    """, (user_id,))

    # --- 2. Ambil materi yang sudah diselesaikan ---
    progress = query("""
        SELECT COUNT(*) AS total_selesai
        FROM user_progress
        WHERE user_id = %s AND is_completed = TRUE
    """, (user_id,))

    total_materi_selesai = progress[0]["total_selesai"] if progress else 0

    # Jika belum ada data kuis sama sekali
    if not scores:
        return {
            "user_id": user_id,
            "total_quiz_dikerjakan": 0,
            "total_materi_selesai": total_materi_selesai,
            "rata_rata_skor": 0,
            "skor_per_level": {},
            "kelemahan": [],
            "kekuatan": [],
            "tren": "belum_ada_data",
            "rekomendasi": "Mulailah mengerjakan kuis untuk mendapatkan analisis performa."
        }

    # --- 3. Hitung statistik umum ---
    semua_skor  = [row["skor"] for row in scores]
    rata_rata   = round(sum(semua_skor) / len(semua_skor), 2)

    # --- 4. Rata-rata skor per level ---
    skor_per_level = {}
    for row in scores:
        level = row["nama_level"]
        if level not in skor_per_level:
            skor_per_level[level] = []
        skor_per_level[level].append(float(row["skor"]))

    skor_per_level_avg = {
        level: round(sum(v) / len(v), 2)
        for level, v in skor_per_level.items()
    }

    # --- 5. Rata-rata skor per course (untuk deteksi kelemahan) ---
    skor_per_course = {}
    for row in scores:
        course = row["judul_course"]
        if course not in skor_per_course:
            skor_per_course[course] = []
        skor_per_course[course].append(float(row["skor"]))

    skor_course_avg = {
        course: round(sum(v) / len(v), 2)
        for course, v in skor_per_course.items()
    }

    # Kelemahan = course dengan rata-rata skor < 70
    # Kekuatan  = course dengan rata-rata skor >= 80
    kelemahan = [c for c, s in skor_course_avg.items() if s < 70]
    kekuatan  = [c for c, s in skor_course_avg.items() if s >= 80]

    # --- 6. Analisis tren (bandingkan paruh pertama vs paruh kedua) ---
    tren = _hitung_tren(semua_skor)

    # --- 7. Rekomendasi teks ---
    rekomendasi = _buat_rekomendasi(rata_rata, kelemahan, tren)

    return {
        "user_id"             : user_id,
        "total_quiz_dikerjakan": len(scores),
        "total_materi_selesai" : total_materi_selesai,
        "rata_rata_skor"       : rata_rata,
        "skor_per_level"       : skor_per_level_avg,
        "skor_per_course"      : skor_course_avg,
        "kelemahan"            : kelemahan,
        "kekuatan"             : kekuatan,
        "tren"                 : tren,
        "rekomendasi"          : rekomendasi,
    }


def _hitung_tren(semua_skor: list) -> str:
    """Bandingkan rata-rata paruh pertama vs paruh kedua skor."""
    if len(semua_skor) < 4:
        return "belum_cukup_data"

    mid      = len(semua_skor) // 2
    awal     = sum(semua_skor[:mid]) / mid
    akhir    = sum(semua_skor[mid:]) / (len(semua_skor) - mid)
    selisih  = akhir - awal

    if selisih >= 5:
        return "meningkat"
    elif selisih <= -5:
        return "menurun"
    else:
        return "stabil"


def _buat_rekomendasi(rata_rata: float, kelemahan: list, tren: str) -> str:
    """Hasilkan teks rekomendasi berdasarkan performa siswa."""
    bagian = []

    if rata_rata >= 85:
        bagian.append("Performa Anda sangat baik! Pertahankan semangat belajarnya.")
    elif rata_rata >= 70:
        bagian.append("Performa Anda sudah cukup baik. Terus tingkatkan latihan.")
    else:
        bagian.append("Performa Anda masih perlu ditingkatkan. Jangan menyerah!")

    if kelemahan:
        topik = ", ".join(kelemahan[:3])
        bagian.append(f"Fokuskan latihan pada topik: {topik}.")

    if tren == "meningkat":
        bagian.append("Tren belajar Anda sedang meningkat — luar biasa!")
    elif tren == "menurun":
        bagian.append("Tren belajar Anda sedikit menurun. Coba review materi dari awal.")

    return " ".join(bagian)
