const express = require('express');
const router = express.Router();
const { markLessonComplete, submitQuizScore, getDashboardStats, getUserProgress } = require('../controllers/progressController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/lesson', markLessonComplete);
router.post('/submit-quiz', submitQuizScore);    
router.get('/dashboard', getDashboardStats);
router.get('/my-progress', getUserProgress);

module.exports = router;