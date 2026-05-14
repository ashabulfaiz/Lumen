const express = require('express');
const router = express.Router();

const { savePlacementResult, getPlacementQuestions } = require('../controllers/placementController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/questions', verifyToken, getPlacementQuestions);
router.post('/save-result', verifyToken, savePlacementResult);

module.exports = router;