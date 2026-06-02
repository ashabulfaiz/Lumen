const db = require('../config/database');

const GRAMMAR_PASS_PERCENT = 60;
const QUIZ_PASS_PERCENT = 70;

class ProgressModel {
    static async checkLessonProgress(userId, lessonId) {
        const [rows] = await db.query(
            'SELECT * FROM user_progress WHERE user_id = ? AND lesson_id = ?',
            [userId, lessonId]
        );
        return rows;
    }

    static async updateLessonProgress(progressId) {
        const [result] = await db.query(
            'UPDATE user_progress SET is_completed = true, last_accessed = CURRENT_TIMESTAMP WHERE id = ?',
            [progressId]
        );
        return result;
    }

    static async insertLessonProgress(userId, lessonId) {
        const [result] = await db.query(
            'INSERT INTO user_progress (user_id, lesson_id, is_completed) VALUES (?, ?, true)',
            [userId, lessonId]
        );
        return result;
    }

    static async insertQuizScore(userId, quizId, score) {
        const [result] = await db.query(
            'INSERT INTO quiz_scores (user_id, quiz_type, quiz_id, skor) VALUES (?, \'module\', ?, ?)',
            [userId, quizId, score]
        );
        return result;
    }

    static async getDashboardStats(userId) {
        const [rows] = await db.query(
            'SELECT AVG(skor) as rata_rata_skor, COUNT(id) as total_kuis FROM quiz_scores WHERE user_id = ?',
            [userId]
        );
        return rows[0];
    }

    static async getUserInfo(userId) {
        const [rows] = await db.query('SELECT current_level, is_onboarding_complete FROM users WHERE id = ?', [userId]);
        return rows[0];
    }

    static async getCompletedLessons(userId) {
        const [rows] = await db.query('SELECT lesson_id FROM user_progress WHERE user_id = ? AND is_completed = true', [userId]);
        return rows.map(row => row.lesson_id);
    }

    static async getQuizCompletedLessonIds(userId, levelId) {
        // A lesson's quiz only counts as passed when the user's BEST module-quiz
        // score for it reaches the passing threshold. Retakes (multiple rows) are
        // collapsed with MAX so an earlier failing attempt never blocks a later pass.
        const [rows] = await db.query(`
            SELECT q.lesson_id
            FROM quiz_scores qs
            JOIN quizzes q ON qs.quiz_id = q.id
            JOIN lessons l ON q.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            WHERE qs.user_id = ? AND c.level_id = ? AND qs.quiz_type = 'module'
            GROUP BY q.lesson_id
            HAVING MAX(qs.skor) >= ?
        `, [userId, levelId, QUIZ_PASS_PERCENT]);

        return rows.map((row) => row.lesson_id);
    }

    static async getEssayCompletedLessonIds(userId, levelId) {
        const [rows] = await db.query(`
            SELECT ec.lesson_id
            FROM essay_completions ec
            JOIN lessons l ON ec.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            WHERE ec.user_id = ?
              AND c.level_id = ?
              AND ec.grammar_score_percent IS NOT NULL
              AND ec.grammar_score_percent >= ?
        `, [userId, levelId, GRAMMAR_PASS_PERCENT]);

        return rows.map((row) => row.lesson_id);
    }

    static async saveEssaySubmission(userId, lessonId, payload) {
        const {
            question,
            answer,
            grammar_score_percent: grammarScore,
            grammar_feedback: grammarFeedback,
            rubric_feedback: rubricFeedback,
        } = payload;

        const [result] = await db.query(
            `INSERT INTO essay_completions (
                user_id, lesson_id, question_text, answer_text,
                grammar_score_percent, grammar_feedback_json, rubric_feedback_json
             )
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                question_text = VALUES(question_text),
                answer_text = VALUES(answer_text),
                grammar_score_percent = VALUES(grammar_score_percent),
                grammar_feedback_json = VALUES(grammar_feedback_json),
                rubric_feedback_json = VALUES(rubric_feedback_json),
                completed_at = CURRENT_TIMESTAMP`,
            [
                userId,
                lessonId,
                question ?? null,
                answer ?? null,
                grammarScore ?? null,
                grammarFeedback ? JSON.stringify(grammarFeedback) : null,
                rubricFeedback ? JSON.stringify(rubricFeedback) : null,
            ]
        );

        const passed =
            grammarScore != null && Number(grammarScore) >= GRAMMAR_PASS_PERCENT;

        return { result, passed, pass_threshold: GRAMMAR_PASS_PERCENT };
    }

    static async getEssaySubmission(userId, lessonId) {
        const [rows] = await db.query(
            `SELECT question_text, answer_text, grammar_score_percent,
                    grammar_feedback_json, rubric_feedback_json, completed_at
             FROM essay_completions
             WHERE user_id = ? AND lesson_id = ?`,
            [userId, lessonId]
        );

        const row = rows[0];
        if (!row || !row.answer_text) return null;

        const parseJson = (val) => {
            if (val == null) return null;
            if (typeof val === 'object') return val;
            try {
                return JSON.parse(val);
            } catch {
                return null;
            }
        };

        const grammarScore = row.grammar_score_percent != null
            ? Number(row.grammar_score_percent)
            : null;

        return {
            question_text: row.question_text,
            answer_text: row.answer_text,
            grammar_score_percent: grammarScore,
            grammar_feedback: parseJson(row.grammar_feedback_json),
            rubric_feedback: parseJson(row.rubric_feedback_json),
            completed_at: row.completed_at,
            writing_passed:
                grammarScore != null && grammarScore >= GRAMMAR_PASS_PERCENT,
            pass_threshold: GRAMMAR_PASS_PERCENT,
        };
    }

    static async getModuleStatusByLevel(userId, levelId) {
        const [lessonRows] = await db.query(`
            SELECT l.id AS lesson_id
            FROM lessons l
            JOIN courses c ON l.course_id = c.id
            WHERE c.level_id = ?
            ORDER BY c.urutan ASC, l.urutan ASC, l.id ASC
        `, [levelId]);

        const quizIds = new Set(await this.getQuizCompletedLessonIds(userId, levelId));
        const essayIds = new Set(await this.getEssayCompletedLessonIds(userId, levelId));

        return lessonRows.map((row) => {
            const lessonId = row.lesson_id;
            const quiz_completed = quizIds.has(lessonId);
            const essay_completed = essayIds.has(lessonId);
            return {
                lesson_id: lessonId,
                quiz_completed,
                essay_completed,
                module_completed: quiz_completed && essay_completed,
            };
        });
    }

    static async getCompletedLessonsByLevel(userId, levelId) {
        const statuses = await this.getModuleStatusByLevel(userId, levelId);
        return statuses
            .filter((s) => s.module_completed)
            .map((s) => s.lesson_id);
    }

    // The unlocked ceiling = the placement floor, raised by one each time the
    // current top level is fully completed (every module's quiz & writing passed).
    // Monotonic and capped at Advanced (3); 0 means placement not done yet.
    static async getUnlockedLevel(userId) {
        const numToName = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' };
        const nameToNum = { Beginner: 1, Intermediate: 2, Advanced: 3 };

        const [[userRow]] = await db.query(
            'SELECT current_level, is_onboarding_complete FROM users WHERE id = ?',
            [userId],
        );
        const onboardingComplete = userRow ? Boolean(userRow.is_onboarding_complete) : false;
        const placementLevel = userRow ? (nameToNum[userRow.current_level] || 1) : 1;

        const levels = [];
        let highestCompleted = 0;
        for (let n = 1; n <= 3; n++) {
            const [[lvl]] = await db.query(
                'SELECT id FROM levels WHERE nama_level = ? LIMIT 1',
                [numToName[n]],
            );
            if (!lvl) {
                levels.push({ level: n, total: 0, completed: 0, isComplete: false });
                continue;
            }
            const [[totalRow]] = await db.query(
                `SELECT COUNT(l.id) AS total
                 FROM lessons l JOIN courses c ON l.course_id = c.id
                 WHERE c.level_id = ?`,
                [lvl.id],
            );
            const total = totalRow.total;
            const completed = (await this.getCompletedLessonsByLevel(userId, lvl.id)).length;
            const isComplete = total > 0 && completed >= total;
            if (isComplete) highestCompleted = n;
            levels.push({ level: n, total, completed, isComplete });
        }

        let unlockedLevel = onboardingComplete ? placementLevel : 0;
        if (onboardingComplete && highestCompleted > 0) {
            unlockedLevel = Math.max(unlockedLevel, Math.min(3, highestCompleted + 1));
        }

        return { unlockedLevel, placementLevel, onboardingComplete, levels };
    }

    static async resetUserProgress(userId) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query('DELETE FROM user_answers WHERE user_id = ?', [userId]);
            await conn.query('DELETE FROM user_progress WHERE user_id = ?', [userId]);
            await conn.query('DELETE FROM quiz_scores WHERE user_id = ?', [userId]);
            await conn.query('DELETE FROM essay_completions WHERE user_id = ?', [userId]);
            await conn.query('DELETE FROM certificates WHERE user_id = ?', [userId]);
            await conn.query(
                "UPDATE users SET current_level = 'Beginner', is_onboarding_complete = false WHERE id = ?",
                [userId],
            );
            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }
}

ProgressModel.QUIZ_PASS_PERCENT = QUIZ_PASS_PERCENT;
ProgressModel.GRAMMAR_PASS_PERCENT = GRAMMAR_PASS_PERCENT;

module.exports = ProgressModel;