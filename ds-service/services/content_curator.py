"""
services/content_curator.py
=============================
Menyusun dan mengelompokkan kurikulum materi per level
(Beginner, Intermediate, Advanced) berdasarkan data di database.

Tugas utama:
- Ambil daftar courses & lessons per level dari DB
- Hitung statistik materi (jumlah course, lesson, dll)
- Tentukan estimasi durasi belajar per level
- Tandai topik-topik apa saja yang ada di setiap level
"""

from utils.db import query


# Estimasi durasi belajar per lesson (menit). Skema `lessons` saat ini tidak
# menyimpan tipe konten, jadi dipakai durasi default yang seragam.
DEFAULT_LESSON_MINUTES = 10

# Tabel `levels` tidak punya kolom urutan, jadi urutannya ditentukan di sini.
LEVEL_ORDER = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}


def get_curriculum(nama_level: str) -> dict:
    """
    Mengembalikan struktur kurikulum lengkap untuk satu level.
    
    Parameter:
        nama_level (str): 'Beginner', 'Intermediate', atau 'Advanced'
    
    Output: dict berisi level, list modul (courses + lessons), statistik
    """
    nama_level_title = nama_level.strip().title()

    if nama_level_title not in ("Beginner", "Intermediate", "Advanced"):
        return {
            "error": f"Level '{nama_level}' tidak valid. Gunakan: Beginner, Intermediate, atau Advanced."
        }

    # 1. Ambil data level dari DB (tabel `levels` tidak punya kolom urutan,
    #    jadi urutan diambil dari mapping LEVEL_ORDER).
    level_rows = query(
        "SELECT id, nama_level FROM levels WHERE nama_level = %s LIMIT 1",
        (nama_level_title,)
    )
    if not level_rows:
        return {"error": f"Level '{nama_level_title}' belum dikonfigurasi di database."}

    level_id    = level_rows[0]["id"]
    level_urutan = LEVEL_ORDER.get(nama_level_title, 0)

    # 2. Ambil semua courses di level ini
    courses = query("""
        SELECT id, judul_course, deskripsi, urutan
        FROM courses
        WHERE level_id = %s
        ORDER BY urutan ASC
    """, (level_id,))

    if not courses:
        return {
            "level"       : nama_level_title,
            "urutan_level": level_urutan,
            "total_course": 0,
            "total_lesson": 0,
            "estimasi_durasi_menit": 0,
            "modul"       : [],
            "pesan"       : "Belum ada materi yang dikonfigurasi untuk level ini."
        }

    # 3. Untuk setiap course, ambil lessons-nya
    modul      = []
    total_lesson = 0
    total_menit  = 0

    for course in courses:
        lessons = query("""
            SELECT id, judul_lesson, urutan
            FROM lessons
            WHERE course_id = %s
            ORDER BY urutan ASC, id ASC
        """, (course["id"],))

        # Skema `lessons` tidak menyimpan tipe konten, jadi pakai durasi default.
        menit_course = len(lessons) * DEFAULT_LESSON_MINUTES

        modul.append({
            "urutan"           : course["urutan"],
            "judul_course"     : course["judul_course"],
            "deskripsi"        : course["deskripsi"],
            "jumlah_lesson"    : len(lessons),
            "estimasi_menit"   : menit_course,
            "lessons"          : [
                {
                    "id"          : l["id"],
                    "judul"       : l["judul_lesson"],
                    "durasi_menit": DEFAULT_LESSON_MINUTES,
                }
                for l in lessons
            ]
        })

        total_lesson += len(lessons)
        total_menit  += menit_course

    return {
        "level"                : nama_level_title,
        "urutan_level"         : level_urutan,
        "total_course"         : len(courses),
        "total_lesson"         : total_lesson,
        "estimasi_durasi_menit": total_menit,
        "estimasi_durasi_jam"  : round(total_menit / 60, 1),
        "modul"                : modul,
    }


def get_all_curricula() -> dict:
    """
    Mengembalikan ringkasan kurikulum untuk semua 3 level sekaligus.
    Berguna untuk halaman overview di frontend.
    """
    result = {}
    for level in ["Beginner", "Intermediate", "Advanced"]:
        data = get_curriculum(level)
        result[level] = {
            "total_course"         : data.get("total_course", 0),
            "total_lesson"         : data.get("total_lesson", 0),
            "estimasi_durasi_jam"  : data.get("estimasi_durasi_jam", 0),
        }
    return result
