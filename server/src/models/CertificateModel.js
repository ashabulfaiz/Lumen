const db = require('../config/database');

class CertificateModel {
    static async checkExistingCertificate(userId, levelId) {
        const [rows] = await db.query(
            'SELECT * FROM certificates WHERE user_id = ? AND level_id = ?',
            [userId, levelId]
        );
        return rows[0];
    }

    static async countPassedCourses(userId, levelId) {
        const [rows] = await db.query(`
            SELECT COUNT(DISTINCT q.course_id) as total_lulus
            FROM quiz_scores qs
            JOIN quizzes q ON qs.quiz_id = q.id
            JOIN courses c ON q.course_id = c.id
            WHERE qs.user_id = ? AND c.level_id = ? AND qs.skor >= 70
        `, [userId, levelId]);
        return rows[0].total_lulus;
    }

    static async countTotalCoursesInLevel(levelId) {
        const [rows] = await db.query(`SELECT c.id FROM courses c WHERE c.level_id = ?`, [levelId]);
        return rows.length;
    }

    static async createCertificate(userId, levelId, uniqueCode) {
        await db.query(
            'INSERT INTO certificates (user_id, level_id, certificate_code) VALUES (?, ?, ?)',
            [userId, levelId, uniqueCode]
        );
        const [rows] = await db.query(
            'SELECT * FROM certificates WHERE certificate_code = ?',
            [uniqueCode]
        );
        return rows[0];
    }

    static async getUserCertificates(userId) {
        const [rows] = await db.query(`
            SELECT c.certificate_code, c.issued_at, l.nama_level, lang.nama_bahasa
            FROM certificates c
            JOIN levels l ON c.level_id = l.id
            JOIN languages lang ON l.language_id = lang.id
            WHERE c.user_id = ?
            ORDER BY c.issued_at DESC
        `, [userId]);
        return rows;
    }
}

module.exports = CertificateModel;