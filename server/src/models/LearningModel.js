const db = require('../config/database');

class LearningModel {
    static async getAllLanguages() {
        const [rows] = await db.query('SELECT * FROM languages');
        return rows;
    }

    static async getLevelsByLanguage(language_id) {
        const [rows] = await db.query('SELECT * FROM levels WHERE language_id = ? ORDER BY urutan ASC', [language_id]);
        return rows;
    }

    static async getCoursesByLevel(level_id) {
        const [rows] = await db.query('SELECT * FROM courses WHERE level_id = ? ORDER BY urutan ASC', [level_id]);
        return rows;
    }

    static async getLessonsByCourse(course_id) {
        const [rows] = await db.query('SELECT * FROM lessons WHERE course_id = ?', [course_id]);
        return rows;
    }
}

module.exports = LearningModel;