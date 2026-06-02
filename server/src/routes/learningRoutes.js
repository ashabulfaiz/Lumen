const express = require('express');
const router = express.Router();
const {
    getLanguages,
    getLevelsByLanguage,
    getCoursesByLevel,
    getLessonsByCourse,
    getLessonById,
} = require('../controllers/learningController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/languages', verifyToken, getLanguages);
router.get('/levels/:language_id', verifyToken, getLevelsByLanguage);
router.get('/courses/:level_ref', verifyToken, getCoursesByLevel);
router.get('/lesson/:lesson_id', verifyToken, getLessonById);
router.get('/lessons/:course_id', verifyToken, getLessonsByCourse);

module.exports = router;
