const express = require('express');
const router = express.Router();
const { checkGrammar } = require('../controllers/grammarController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/check', verifyToken, checkGrammar);
module.exports = router;