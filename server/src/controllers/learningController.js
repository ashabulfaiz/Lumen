const db = require('../config/database');

// 1. Mengambil semua bahasa yang tersedia
const getLanguages = async (req, res) => {
    try {
        const [languages] = await db.query('SELECT * FROM languages');
        res.status(200).json({ status: "success", data: languages });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data bahasa", error: error.message });
    }
};

// 2. Mengambil level berdasarkan ID bahasa
const getLevelsByLanguage = async (req, res) => {
    try {
        const { language_id } = req.params;
        const [levels] = await db.query('SELECT * FROM levels WHERE language_id = ? ORDER BY urutan ASC', [language_id]);
        res.status(200).json({ status: "success", data: levels });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data level", error: error.message });
    }
};

// 3. Mengambil courses (materi utama) berdasarkan ID level
const getCoursesByLevel = async (req, res) => {
    try {
        const { level_id } = req.params;
        const [courses] = await db.query('SELECT * FROM courses WHERE level_id = ? ORDER BY urutan ASC', [level_id]);
        res.status(200).json({ status: "success", data: courses });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data course", error: error.message });
    }
};

// 4. Mengambil detail lessons berdasarkan ID course
const getLessonsByCourse = async (req, res) => {
    try {
        const { course_id } = req.params;
        const [lessons] = await db.query('SELECT * FROM lessons WHERE course_id = ?', [course_id]);
        res.status(200).json({ status: "success", data: lessons });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data lesson", error: error.message });
    }
};

module.exports = {
    getLanguages,
    getLevelsByLanguage,
    getCoursesByLevel,
    getLessonsByCourse
};