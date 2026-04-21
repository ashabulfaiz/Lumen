const express = require('express');
const router = express.Router();
const { sendChatMessage, getChatHistory } = require('../controllers/helpController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Gunakan gembok keamanan untuk semua rute AI Chat
router.use(verifyToken);

// Endpoint API
router.post('/chat', sendChatMessage); // Kirim pesan ke AI
router.get('/history', getChatHistory); // Ambil riwayat chat

module.exports = router;