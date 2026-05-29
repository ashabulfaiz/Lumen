const fs = require('fs');
const path = require('path');
const db = require('./database');

async function seedCurriculum({ force = false } = {}) {
    const [existing] = await db.query('SELECT COUNT(*) AS n FROM levels');
    if (existing[0].n > 0 && !force) {
        console.log(`ℹ️  Kurikulum sudah ada (${existing[0].n} level). Lewati seeding.`);
        return { skipped: true, levels: existing[0].n };
    }

    if (force && existing[0].n > 0) {
        console.log('🔄 Menghapus data kurikulum lama...');
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        await db.query('TRUNCATE TABLE user_progress');
        await db.query('TRUNCATE TABLE quizzes');
        await db.query('TRUNCATE TABLE questions');
        await db.query('TRUNCATE TABLE lessons');
        await db.query('TRUNCATE TABLE courses');
        await db.query('TRUNCATE TABLE levels');
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
    }

    const jsonPath = path.join(__dirname, '../data/dummy_curriculum.json');
    const curriculumData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const languageId = 1;

    for (const level of curriculumData) {
        const [levelResult] = await db.query(
            'INSERT INTO levels (language_id, nama_level, urutan) VALUES (?, ?, ?)',
            [languageId, level.nama_level, level.urutan ?? null]
        );
        const levelId = levelResult.insertId;
        console.log(`✅ Level: ${level.nama_level} (ID: ${levelId})`);

        for (const course of level.courses) {
            const [courseResult] = await db.query(
                'INSERT INTO courses (level_id, judul_course, deskripsi, urutan) VALUES (?, ?, ?, ?)',
                [levelId, course.judul_course, course.deskripsi, course.urutan]
            );
            const courseId = courseResult.insertId;

            for (const lesson of course.lessons) {
                await db.query(
                    'INSERT INTO lessons (course_id, judul_lesson, konten_teks, video_url, urutan) VALUES (?, ?, ?, ?, ?)',
                    [
                        courseId,
                        lesson.judul_lesson,
                        lesson.konten_teks,
                        lesson.video_url ?? null,
                        lesson.urutan,
                    ]
                );
            }
        }
    }

    const [counts] = await db.query(`
        SELECT
            (SELECT COUNT(*) FROM levels) AS levels,
            (SELECT COUNT(*) FROM courses) AS courses,
            (SELECT COUNT(*) FROM lessons) AS lessons
    `);
    const summary = counts[0];
    console.log(
        `🎉 Kurikulum siap: ${summary.levels} level, ${summary.courses} course, ${summary.lessons} lesson.`
    );
    return { skipped: false, ...summary };
}

if (require.main === module) {
    seedCurriculum({ force: process.argv.includes('--force') })
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('❌ Seeding gagal:', error);
            process.exit(1);
        });
}

module.exports = { seedCurriculum };
