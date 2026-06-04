const express = require('express');
const router = express.Router();
const {
    markLessonComplete,
    submitQuizScore,
    getDashboardStats,
    getUserProgress,
    getCompletedLessons,
    getModuleStatus,
    saveEssaySubmission,
    getEssaySubmission,
    resetProgress,
    getUnlockedLevel,
    getLearningAnalytics,
} = require('../controllers/progressController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/lesson', markLessonComplete);
router.post('/submit-quiz', submitQuizScore);
router.get('/dashboard', getDashboardStats);
router.get('/my-progress', getUserProgress);
router.get('/completed/:level_ref', getCompletedLessons);
router.get('/module-status/:level_ref', getModuleStatus);
router.get('/essay/:lesson_id', getEssaySubmission);
router.post('/essay', saveEssaySubmission);
router.post('/reset', resetProgress);
router.get('/unlocked-level', getUnlockedLevel);
router.get('/analytics', getLearningAnalytics);

module.exports = router;
