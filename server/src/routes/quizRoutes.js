const express = require('express');
const router = express.Router();
const { generateQuiz, submitQuiz, getQuizReview } = require('../controllers/quizController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/generate', verifyToken, generateQuiz);
router.post('/submit', verifyToken, submitQuiz);
router.get('/review/:quizId', verifyToken, getQuizReview);

module.exports = router;