const LearningModel = require('../models/LearningModel');
const { resolveLevelId } = require('../utils/resolveLevelId');

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
        const levelId = await resolveLevelId(req.params.level_ref);
        if (!levelId) {
            return res.status(404).json({ message: 'Level not found' });
        }
        const courses = await LearningModel.getCoursesByLevel(levelId);
        res.status(200).json({ status: 'success', data: courses, level_id: levelId });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data course', error: error.message });
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

const getLessonById = async (req, res) => {
    try {
        const lessonId = parseInt(req.params.lesson_id, 10);
        if (!lessonId) {
            return res.status(400).json({ message: 'lesson_id is required' });
        }
        const lesson = await LearningModel.getLessonById(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        res.status(200).json({ status: 'success', data: lesson });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data lesson', error: error.message });
    }
};

module.exports = {
    getLanguages,
    getLevelsByLanguage,
    getCoursesByLevel,
    getLessonsByCourse,
    getLessonById,
};