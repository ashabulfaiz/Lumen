const LearningModel = require('../models/LearningModel');

const getLanguages = async (req, res) => {
    try {
        const languages = await LearningModel.getAllLanguages();
        res.status(200).json({ status: "success", data: languages });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data bahasa", error: error.message });
    }
};

const getLevelsByLanguage = async (req, res) => {
    try {
        const { language_id } = req.params;
        const levels = await LearningModel.getLevelsByLanguage(language_id);
        res.status(200).json({ status: "success", data: levels });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data level", error: error.message });
    }
};

const getCoursesByLevel = async (req, res) => {
    try {
        const { level_id } = req.params;
        const courses = await LearningModel.getCoursesByLevel(level_id);
        res.status(200).json({ status: "success", data: courses });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data course", error: error.message });
    }
};

const getLessonsByCourse = async (req, res) => {
    try {
        const { course_id } = req.params;
        const lessons = await LearningModel.getLessonsByCourse(course_id);
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