const express = require('express');
const router = express.Router();
const { sendChatMessage, getChatHistory } = require('../controllers/helpController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);
router.post('/chat', sendChatMessage);
router.get('/history', getChatHistory);

module.exports = router;