const db = require('../config/database');

const GRAMMAR_PASS_PERCENT = 60;

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
        const [rows] = await db.query(`
            SELECT DISTINCT q.lesson_id
            FROM quiz_scores qs
            JOIN quizzes q ON qs.quiz_id = q.id
            JOIN lessons l ON q.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            WHERE qs.user_id = ? AND c.level_id = ?
        `, [userId, levelId]);

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
}

module.exports = ProgressModel;