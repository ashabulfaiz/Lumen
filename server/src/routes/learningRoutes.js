const express = require('express');
const router = express.Router();
const { 
    getLanguages, 
    getLevelsByLanguage, 
    getCoursesByLevel, 
    getLessonsByCourse 
} = require('../controllers/learningController');

const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/languages', verifyToken, getLanguages);
router.get('/levels/:language_id', verifyToken, getLevelsByLanguage);
router.get('/courses/:level_id', verifyToken, getCoursesByLevel);
router.get('/lessons/:course_id', verifyToken, getLessonsByCourse);

module.exports = router;