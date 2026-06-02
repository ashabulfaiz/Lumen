const db = require('../config/database');

class PlacementModel {
    static async getRandomQuestions() {
        const [rows] = await db.query(`
            SELECT * FROM (
                (SELECT * FROM placement_questions WHERE id BETWEEN 1 AND 33 ORDER BY RAND() LIMIT 5)
                UNION ALL
                (SELECT * FROM placement_questions WHERE id BETWEEN 34 AND 66 ORDER BY RAND() LIMIT 5)
                UNION ALL
                (SELECT * FROM placement_questions WHERE id BETWEEN 67 AND 100 ORDER BY RAND() LIMIT 5)
            ) AS combined_questions
            ORDER BY RAND();
        `);
        return rows;
    }

    static async updateUserLevel(userId, level) {
        const [result] = await db.query(
            'UPDATE users SET current_level = ?, is_onboarding_complete = true WHERE id = ?',
            [level, userId]
        );
        return result;
    }

    static async savePlacementScore(userId, score) {
        const [result] = await db.query(
            'INSERT INTO quiz_scores (user_id, quiz_type, skor) VALUES (?, "placement", ?)',
            [userId, score]
        );
        return result;
    }

    static async saveUserAnswers(detailValues) {
        const [result] = await db.query(
            'INSERT INTO user_answers (user_id, placement_question_id, jawaban_teks) VALUES ?', 
            [detailValues]
        );
        return result;
    }
}

module.exports = PlacementModel;