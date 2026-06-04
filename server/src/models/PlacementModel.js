const db = require('../config/database');

const PLACEMENT_TOTAL = 15;
const BEGINNER_COUNT = 5;
const INTERMEDIATE_COUNT = 5;
const ADVANCED_COUNT = 5;

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

    static async getPlacementScore(userId) {
        const [rows] = await db.query(
            'SELECT skor FROM quiz_scores WHERE user_id = ? AND quiz_type = "placement" ORDER BY id DESC LIMIT 1',
            [userId]
        );
        return rows.length > 0 ? rows[0].skor : null;
    }

    static async getUserPlacementAnswers(userId) {
        const [rows] = await db.query(`
            SELECT pq.id, pq.pertanyaan as prompt, pq.pilihan_a, pq.pilihan_b, pq.pilihan_c, pq.pilihan_d, pq.jawaban_benar as answer, ua.jawaban_teks as user_answer
            FROM user_answers ua
            JOIN placement_questions pq ON ua.placement_question_id = pq.id
            WHERE ua.user_id = ?
        `, [userId]);
        return rows;
    }
}

module.exports = PlacementModel;