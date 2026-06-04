require('./loadEnv');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

const ESSAY_EXTRA_COLUMNS = [
    { name: 'question_text', ddl: 'TEXT NULL' },
    { name: 'answer_text', ddl: 'TEXT NULL' },
    { name: 'grammar_score_percent', ddl: 'INT NULL' },
    { name: 'grammar_feedback_json', ddl: 'JSON NULL' },
    { name: 'rubric_feedback_json', ddl: 'JSON NULL' },
];

async function ensureEssayCompletionsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS essay_completions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            lesson_id INT NOT NULL,
            question_text TEXT NULL,
            answer_text TEXT NULL,
            grammar_score_percent INT NULL,
            grammar_feedback_json JSON NULL,
            rubric_feedback_json JSON NULL,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_user_lesson_essay (user_id, lesson_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
        )
    `);

    for (const col of ESSAY_EXTRA_COLUMNS) {
        try {
            await pool.query(
                `ALTER TABLE essay_completions ADD COLUMN ${col.name} ${col.ddl}`,
            );
        } catch (err) {
            if (err.code !== 'ER_DUP_FIELDNAME') throw err;
        }
    }
}

async function runStartupMigrations() {
    try {
        await ensureEssayCompletionsTable();
    } catch (err) {
        console.warn('⚠️ essay_completions migration skipped:', err.message);
    }

    try {
        const { ensureCurriculum } = require('./curriculumSeed');
        await ensureCurriculum();
        console.log('✅ Kurikulum Beginner / Intermediate / Advanced siap.');
    } catch (err) {
        console.warn('⚠️ Gagal memuat kurikulum:', err.message);
    }

    try {
        const { seedPlacementQuestions } = require('./seeder');
        await seedPlacementQuestions();
    } catch (err) {
        console.warn('⚠️ Gagal memuat soal placement:', err.message);
    }
}

let dbReadyPromise = null;

function waitForDatabase() {
    if (!dbReadyPromise) {
        dbReadyPromise = pool.getConnection()
            .then(async (conn) => {
                console.log('✅ Terhubung ke database MySQL (LUMEN)!');
                await runStartupMigrations();
                conn.release();
            })
            .catch((err) => {
                console.error('❌ Gagal terhubung ke database:', err.message);
                throw err;
            });
    }
    return dbReadyPromise;
}

waitForDatabase().catch(() => {});

module.exports = pool;
module.exports.waitForDatabase = waitForDatabase;
