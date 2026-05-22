const fs = require('fs');
const path = require('path');
const db = require('./database'); // Pastikan path ke koneksi pool database sudah benar

async function seedCurriculum() {
    try {
        console.log("⏳ Memulai proses seeding data kurikulum...");

        const jsonPath = path.join(__dirname, '../data/dummy_curriculum.json');
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const curriculumData = JSON.parse(rawData);
        const languageId = 1; 

        for (const level of curriculumData) {
            const [levelResult] = await db.query(
                'INSERT INTO levels (language_id, nama_level) VALUES (?, ?)',
                [languageId, level.nama_level]
            );
            const levelId = levelResult.insertId;
            console.log(`✅ Level Berhasil Dimasukkan: ${level.nama_level} (ID: ${levelId})`);

            for (const course of level.courses) {
                const [courseResult] = await db.query(
                    'INSERT INTO courses (level_id, judul_course, deskripsi, urutan) VALUES (?, ?, ?, ?)',
                    [levelId, course.judul_course, course.deskripsi, course.urutan]
                );
                const courseId = courseResult.insertId;
                console.log(`   🔹 Course Berhasil Dimasukkan: ${course.judul_course} (ID: ${courseId})`);

                for (const lesson of course.lessons) {
                    await db.query(
                        'INSERT INTO lessons (course_id, judul_lesson, konten_teks, video_url, urutan) VALUES (?, ?, ?, ?, ?)',
                        [courseId, lesson.judul_lesson, lesson.konten_teks, lesson.video_url, lesson.urutan]
                    );
                    console.log(`      🔸 Lesson Berhasil Dimasukkan: ${lesson.judul_lesson}`);
                }
            }
        }

        console.log("🎉 Seeding Selesai! Database lokal kamu sudah terisi materi dummy.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Seeding Gagal:", error);
        process.exit(1);
    }
}

seedCurriculum();