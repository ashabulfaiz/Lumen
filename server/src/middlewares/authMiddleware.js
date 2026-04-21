const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    // 1. Ambil token dari header request (biasanya formatnya "Bearer <token>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // 2. Jika tidak ada token sama sekali, tolak aksesnya
    if (!token) {
        return res.status(401).json({ 
            status: "error", 
            message: "Akses ditolak! Anda harus login terlebih dahulu (Token tidak ditemukan)." 
        });
    }

    try {
        // 3. Verifikasi keaslian token menggunakan kunci rahasia dari .env
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Jika valid, simpan data user dari token ke dalam req.user agar bisa dipakai di controller
        req.user = verified; 
        
        // 5. Izinkan request lanjut ke controller tujuan
        next(); 
    } catch (error) {
        // Jika token kedaluwarsa atau palsu
        return res.status(403).json({ 
            status: "error", 
            message: "Sesi telah berakhir atau token tidak valid. Silakan login kembali." 
        });
    }
};

module.exports = { verifyToken };