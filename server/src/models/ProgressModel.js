const db = require('../config/database');

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

    static async getCompletedLessonsByLevel(userId, levelId) {
        const db = require('../config/database');
                const [rows] = await db.query(`
            SELECT DISTINCT q.lesson_id 
            FROM quiz_scores qs
            JOIN quizzes q ON qs.quiz_id = q.id
            JOIN lessons l ON q.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            WHERE qs.user_id = ? AND c.level_id = ?
        `, [userId, levelId]);
        
        return rows.map(row => row.lesson_id);
    }
}

module.exports = ProgressModel;