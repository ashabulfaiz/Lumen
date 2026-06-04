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

// Move child rows from duplicate parents onto the surviving parent.
// UPDATE IGNORE skips rows that would violate a unique key on the child
// (e.g. essay_completions has UNIQUE(user_id, lesson_id)); those leftover
// rows get removed by ON DELETE CASCADE when the duplicate parent is deleted.
async function repointChildren(db, childTable, col, keepId, dupIds) {
    try {
        await db.query(
            `UPDATE IGNORE \`${childTable}\` SET \`${col}\` = ? WHERE \`${col}\` IN (?)`,
            [keepId, dupIds],
        );
    } catch (err) {
        if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
    }
}

// Collapse rows that share the same logical key into a single canonical row
// (the one with the smallest id), repointing child references first.
async function dedupeRows(db, { table, groupCols, children }) {
    const groupColSql = groupCols.map((c) => `\`${c}\``).join(', ');
    const [groups] = await db.query(
        `SELECT MIN(id) AS keepId, GROUP_CONCAT(id) AS ids
         FROM \`${table}\`
         GROUP BY ${groupColSql}
         HAVING COUNT(*) > 1`,
    );

    for (const group of groups) {
        const ids = String(group.ids).split(',').map((v) => parseInt(v, 10));
        const dupIds = ids.filter((id) => id !== group.keepId);
        if (dupIds.length === 0) continue;

        for (const child of children) {
            await repointChildren(db, child.table, child.col, group.keepId, dupIds);
        }
        await db.query(`DELETE FROM \`${table}\` WHERE id IN (?)`, [dupIds]);
    }
}

async function ensureUniqueKey(db, table, keyName, cols) {
    try {
        await db.query(`ALTER TABLE \`${table}\` ADD UNIQUE KEY \`${keyName}\` (${cols})`);
    } catch (err) {
        // ER_DUP_KEYNAME (1061) => key already exists, which is the desired state.
        if (err.code !== 'ER_DUP_KEYNAME') {
            console.warn(`⚠️ Could not add unique key ${keyName} on ${table}: ${err.message}`);
        }
    }
}

// Remove any pre-existing duplicates and guarantee the curriculum hierarchy
// can never duplicate again, regardless of how often seeding runs.
async function dedupeAndConstrainCurriculum(db) {
    try {
        await dedupeRows(db, {
            table: 'levels',
            groupCols: ['language_id', 'nama_level'],
            children: [
                { table: 'courses', col: 'level_id' },
                { table: 'certificates', col: 'level_id' },
            ],
        });
        await dedupeRows(db, {
            table: 'courses',
            groupCols: ['level_id', 'judul_course'],
            children: [{ table: 'lessons', col: 'course_id' }],
        });
        await dedupeRows(db, {
            table: 'lessons',
            groupCols: ['course_id', 'judul_lesson'],
            children: [
                { table: 'quizzes', col: 'lesson_id' },
                { table: 'user_progress', col: 'lesson_id' },
                { table: 'essay_completions', col: 'lesson_id' },
            ],
        });
    } catch (err) {
        console.warn('⚠️ Curriculum de-duplication skipped:', err.message);
    }

    await ensureUniqueKey(db, 'levels', 'uq_level_lang_name', 'language_id, nama_level');
    await ensureUniqueKey(db, 'courses', 'uq_course_level_title', 'level_id, judul_course');
    await ensureUniqueKey(db, 'lessons', 'uq_lesson_course_title', 'course_id, judul_lesson');
}

async function findLevelId(db, languageId, namaLevel) {
    const [rows] = await db.query(
        'SELECT id FROM levels WHERE language_id = ? AND nama_level = ? LIMIT 1',
        [languageId, namaLevel],
    );
    return rows[0]?.id ?? null;
}

async function findOrCreateLevel(db, languageId, namaLevel) {
    const existing = await findLevelId(db, languageId, namaLevel);
    if (existing) return existing;

    try {
        const [result] = await db.query(
            'INSERT INTO levels (language_id, nama_level) VALUES (?, ?)',
            [languageId, namaLevel],
        );
        return result.insertId;
    } catch (err) {
        // Lost a race against a concurrent insert — the unique key rejected it.
        if (err.code === 'ER_DUP_ENTRY') return findLevelId(db, languageId, namaLevel);
        throw err;
    }
}

async function findCourseId(db, levelId, judulCourse) {
    const [rows] = await db.query(
        'SELECT id FROM courses WHERE level_id = ? AND judul_course = ? LIMIT 1',
        [levelId, judulCourse],
    );
    return rows[0]?.id ?? null;
}

async function findOrCreateCourse(db, levelId, course) {
    const existing = await findCourseId(db, levelId, course.judul_course);
    if (existing) {
        await db.query(
            'UPDATE courses SET deskripsi = ?, urutan = ? WHERE id = ?',
            [course.deskripsi, course.urutan, existing],
        );
        return existing;
    }

    try {
        const [result] = await db.query(
            'INSERT INTO courses (level_id, judul_course, deskripsi, urutan) VALUES (?, ?, ?, ?)',
            [levelId, course.judul_course, course.deskripsi, course.urutan],
        );
        return result.insertId;
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return findCourseId(db, levelId, course.judul_course);
        throw err;
    }
}

async function findLessonId(db, courseId, judulLesson) {
    const [rows] = await db.query(
        'SELECT id FROM lessons WHERE course_id = ? AND judul_lesson = ? LIMIT 1',
        [courseId, judulLesson],
    );
    return rows[0]?.id ?? null;
}

async function upsertLesson(db, courseId, lesson) {
    const existing = await findLessonId(db, courseId, lesson.judul_lesson);
    if (existing) {
        await db.query(
            'UPDATE lessons SET konten_teks = ?, kuis_topik_id = ?, urutan = ? WHERE id = ?',
            [lesson.konten_teks, lesson.kuis_topik_id || null, lesson.urutan ?? null, existing],
        );
        return existing;
    }

    try {
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
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return findLessonId(db, courseId, lesson.judul_lesson);
        throw err;
    }
}

async function ensureCurriculum() {
    const db = require('./database');

    await ensureKuisTopikColumn(db);

    await db.query(
        `INSERT IGNORE INTO languages (id, nama_bahasa, kode_iso) VALUES (1, 'English', 'EN')`,
    );

    await dedupeAndConstrainCurriculum(db);

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
