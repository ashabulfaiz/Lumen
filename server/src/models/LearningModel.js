const db = require('../config/database');

class LearningModel {
    static async getAllLanguages() {
        const [rows] = await db.query('SELECT * FROM languages');
        return rows;
    }

    static async getLevelsByLanguage(language_id) {
        const [rows] = await db.query(
            'SELECT * FROM levels WHERE language_id = ? ORDER BY id ASC',
            [language_id],
        );
        return rows;
    }

    static async getCoursesByLevel(level_id) {
        const [rows] = await db.query('SELECT * FROM courses WHERE level_id = ? ORDER BY urutan ASC', [level_id]);
        return rows;
    }

    static async getLessonsByCourse(course_id) {
        const [rows] = await db.query(
            'SELECT * FROM lessons WHERE course_id = ? ORDER BY urutan ASC, id ASC',
            [course_id],
        );
        return rows;
    }

    static async getLessonById(lesson_id) {
        const [rows] = await db.query(
            `SELECT l.*, c.judul_course, c.urutan AS course_urutan, c.level_id,
                    lv.nama_level
             FROM lessons l
             JOIN courses c ON l.course_id = c.id
             JOIN levels lv ON c.level_id = lv.id
             WHERE l.id = ?`,
            [lesson_id],
        );
        return rows[0] || null;
    }
}

module.exports = LearningModel;