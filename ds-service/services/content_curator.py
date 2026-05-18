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


# Estimasi menit per tipe konten (bisa disesuaikan tim DS)
DURASI_PER_TIPE = {
    "Text" : 10,  # menit
    "Video": 20,
    "Audio": 15,
}


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

    # 1. Ambil data level dari DB
    level_rows = query(
        "SELECT id, nama_level, urutan FROM levels WHERE nama_level = %s LIMIT 1",
        (nama_level_title,)
    )
    if not level_rows:
        return {"error": f"Level '{nama_level_title}' belum dikonfigurasi di database."}

    level_id    = level_rows[0]["id"]
    level_urutan = level_rows[0]["urutan"]

    # 2. Ambil semua courses di level ini
    courses = query("""
        SELECT id, judul_course, konten_introduction, urutan
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
            SELECT id, judul_lesson, tipe_konten
            FROM lessons
            WHERE course_id = %s
            ORDER BY id ASC
        """, (course["id"],))

        menit_course = sum(
            DURASI_PER_TIPE.get(l["tipe_konten"], 10) for l in lessons
        )

        modul.append({
            "urutan"           : course["urutan"],
            "judul_course"     : course["judul_course"],
            "deskripsi"        : course["konten_introduction"],
            "jumlah_lesson"    : len(lessons),
            "estimasi_menit"   : menit_course,
            "lessons"          : [
                {
                    "id"          : l["id"],
                    "judul"       : l["judul_lesson"],
                    "tipe_konten" : l["tipe_konten"],
                    "durasi_menit": DURASI_PER_TIPE.get(l["tipe_konten"], 10)
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
