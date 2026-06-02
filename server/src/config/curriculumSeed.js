const fs = require('fs');
const path = require('path');

async function ensureKuisTopikColumn(db) {
    const [cols] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lessons' AND COLUMN_NAME = 'kuis_topik_id'`,
    );
    if (cols.length === 0) {
        await db.query('ALTER TABLE lessons ADD COLUMN kuis_topik_id VARCHAR(255) NULL');
    }
}

async function findOrCreateLevel(db, languageId, namaLevel) {
    const [rows] = await db.query(
        'SELECT id FROM levels WHERE language_id = ? AND nama_level = ? LIMIT 1',
        [languageId, namaLevel],
    );
    if (rows.length > 0) return rows[0].id;

    const [result] = await db.query(
        'INSERT INTO levels (language_id, nama_level) VALUES (?, ?)',
        [languageId, namaLevel],
    );
    return result.insertId;
}

async function findOrCreateCourse(db, levelId, course) {
    const [rows] = await db.query(
        'SELECT id FROM courses WHERE level_id = ? AND judul_course = ? LIMIT 1',
        [levelId, course.judul_course],
    );
    if (rows.length > 0) {
        await db.query(
            'UPDATE courses SET deskripsi = ?, urutan = ? WHERE id = ?',
            [course.deskripsi, course.urutan, rows[0].id],
        );
        return rows[0].id;
    }

    const [result] = await db.query(
        'INSERT INTO courses (level_id, judul_course, deskripsi, urutan) VALUES (?, ?, ?, ?)',
        [levelId, course.judul_course, course.deskripsi, course.urutan],
    );
    return result.insertId;
}

async function upsertLesson(db, courseId, lesson) {
    const [rows] = await db.query(
        'SELECT id FROM lessons WHERE course_id = ? AND judul_lesson = ? LIMIT 1',
        [courseId, lesson.judul_lesson],
    );
    if (rows.length > 0) {
        await db.query(
            'UPDATE lessons SET konten_teks = ?, kuis_topik_id = ?, urutan = ? WHERE id = ?',
            [lesson.konten_teks, lesson.kuis_topik_id || null, lesson.urutan ?? null, rows[0].id],
        );
        return rows[0].id;
    }

    const [result] = await db.query(
        'INSERT INTO lessons (course_id, judul_lesson, konten_teks, kuis_topik_id, urutan) VALUES (?, ?, ?, ?, ?)',
        [
            courseId,
            lesson.judul_lesson,
            lesson.konten_teks,
            lesson.kuis_topik_id || null,
            lesson.urutan ?? null,
        ],
    );
    return result.insertId;
}

async function ensureCurriculum() {
    const db = require('./database');

    await ensureKuisTopikColumn(db);

    await db.query(
        `INSERT IGNORE INTO languages (id, nama_bahasa, kode_iso) VALUES (1, 'English', 'EN')`,
    );

    const jsonPath = path.join(__dirname, '../data/dummy_curriculum.json');
    const curriculumData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const languageId = 1;

    for (const level of curriculumData) {
        const levelId = await findOrCreateLevel(db, languageId, level.nama_level);

        for (const course of level.courses) {
            const courseId = await findOrCreateCourse(db, levelId, course);

            for (const lesson of course.lessons) {
                await upsertLesson(db, courseId, lesson);
            }
        }
    }
}

module.exports = { ensureCurriculum };
