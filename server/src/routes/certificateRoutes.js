const express = require('express');
const router = express.Router();
const { claimCertificate, getMyCertificates } = require('../controllers/certificateController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);
router.post('/claim', claimCertificate); 
router.get('/', getMyCertificates);

module.exports = router;