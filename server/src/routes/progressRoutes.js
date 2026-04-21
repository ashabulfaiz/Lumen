const express = require('express');
const router = express.Router();
const { markLessonComplete, submitQuizScore, getDashboardStats } = require('../controllers/progressController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Terapkan verifyToken untuk semua rute di file ini secara otomatis
router.use(verifyToken);

// Endpoint API
router.post('/lesson', markLessonComplete); // Menyelesaikan materi
router.post('/quiz', submitQuizScore);      // Submit nilai kuis
router.get('/dashboard', getDashboardStats); // Ambil data dashboard

module.exports = router;