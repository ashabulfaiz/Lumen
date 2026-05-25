const db = require('../config/database');

class QuizModel {
    static async getOrCreateQuiz(lessonId, judulQuiz) {
        const [existing] = await db.query('SELECT id FROM quizzes WHERE lesson_id = ?', [lessonId]);
        if (existing.length > 0) return existing[0].id;

        const [result] = await db.query(
            'INSERT INTO quizzes (lesson_id, judul_quiz) VALUES (?, ?)',
            [lessonId, judulQuiz]
        );
        return result.insertId;
    }

    static async saveQuestionCache(quizId, pertanyaan, jawabanBenar) {
        const [existing] = await db.query(
            'SELECT id FROM questions WHERE quiz_id = ? AND pertanyaan = ?', 
            [quizId, pertanyaan]
        );
        if (existing.length > 0) return existing[0].id;

        const [result] = await db.query(
            'INSERT INTO questions (quiz_id, pertanyaan, jawaban_benar) VALUES (?, ?, ?)',
            [quizId, pertanyaan, jawabanBenar]
        );
        return result.insertId;
    }

    static async getCorrectAnswer(questionId) {
        const [rows] = await db.query('SELECT jawaban_benar FROM questions WHERE id = ?', [questionId]);
        return rows[0];
    }

    static async saveUserAnswer(userId, questionId, jawabanTeks, isCorrect) {
        await db.query(
            'DELETE FROM user_answers WHERE user_id = ? AND question_id = ?',
            [userId, questionId]
        );
        const [result] = await db.query(
            'INSERT INTO user_answers (user_id, question_id, jawaban_teks, is_correct) VALUES (?, ?, ?, ?)',
            [userId, questionId, jawabanTeks, isCorrect]
        );
        return result;
    }

    static async getUserAnswers(userId, quizId) {
        const [rows] = await db.query(`
            SELECT ua.question_id, ua.jawaban_teks, ua.is_correct, q.jawaban_benar 
            FROM user_answers ua
            JOIN questions q ON ua.question_id = q.id
            WHERE ua.user_id = ? AND q.quiz_id = ?
        `, [userId, quizId]);
        return rows;
    }
}

module.exports = QuizModel;