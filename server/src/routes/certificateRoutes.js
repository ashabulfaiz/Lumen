const express = require('express');
const router = express.Router();
const { claimCertificate, getMyCertificates } = require('../controllers/certificateController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/claim', claimCertificate); // Tombol klaim sertifikat
router.get('/', getMyCertificates);      // Daftar sertifikat saya

module.exports = router;