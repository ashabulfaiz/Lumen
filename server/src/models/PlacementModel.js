const db = require('../config/database');

const PLACEMENT_TOTAL = 10;
const BEGINNER_COUNT = 4;
const INTERMEDIATE_COUNT = 3;
const ADVANCED_COUNT = 3;

class PlacementModel {
    static async getRandomQuestions() {
        const [rows] = await db.query(`
            SELECT * FROM (
                (SELECT * FROM placement_questions WHERE id BETWEEN 1 AND 33 ORDER BY RAND() LIMIT ?)
                UNION ALL
                (SELECT * FROM placement_questions WHERE id BETWEEN 34 AND 66 ORDER BY RAND() LIMIT ?)
                UNION ALL
                (SELECT * FROM placement_questions WHERE id BETWEEN 67 AND 100 ORDER BY RAND() LIMIT ?)
            ) AS combined_questions
            ORDER BY RAND()
            LIMIT ?
        `, [BEGINNER_COUNT, INTERMEDIATE_COUNT, ADVANCED_COUNT, PLACEMENT_TOTAL]);
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