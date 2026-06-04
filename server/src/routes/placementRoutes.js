const express = require('express');
const router = express.Router();

const { savePlacementResult, getPlacementQuestions, getMyPlacementResult } = require('../controllers/placementController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/questions', verifyToken, getPlacementQuestions);
router.post('/save-result', verifyToken, savePlacementResult);
router.get('/my-result', verifyToken, getMyPlacementResult);

module.exports = router;