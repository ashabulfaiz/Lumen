const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        // 1. Tangkap data dari body request (dikirim oleh frontend/Postman)
        const { nama_lengkap, email, password, current_level } = req.body;

        // 2. Validasi sederhana: Pastikan data penting tidak kosong
        if (!nama_lengkap || !email || !password) {
            return res.status(400).json({ message: "Nama, email, dan password wajib diisi!" });
        }

        // 3. Cek apakah email sudah terdaftar di database
        const [existingUser] = await db.query('SELECT email FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email sudah terdaftar, silakan gunakan email lain." });
        }

        // 4. Acak (Hash) Password menggunakan bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Set level default jika tidak dipilih
        const level = current_level || 'Beginner';

        // 6. Simpan data ke tabel users
        const [result] = await db.query(
            'INSERT INTO users (nama_lengkap, email, password_hash, current_level, role) VALUES (?, ?, ?, ?, ?)',
            [nama_lengkap, email, hashedPassword, level, 'student']
        );

        // 7. Berikan respons sukses
        res.status(201).json({
            status: "success",
            message: "Registrasi berhasil!",
            data: {
                id: result.insertId,
                nama_lengkap,
                email,
                current_level: level
            }
        });

    } catch (error) {
        console.error("❌ Error pada fitur Register:", error);
        res.status(500).json({ message: "Terjadi kesalahan internal pada server." });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validasi input
        if (!email || !password) {
            return res.status(400).json({ message: "Email dan password wajib diisi!" });
        }

        // 2. Cari user berdasarkan email
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0]; // Ambil data user pertama

        if (!user) {
            return res.status(401).json({ message: "Email tidak ditemukan." });
        }

        // 3. Cocokkan password yang diketik dengan password_hash di database
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Password salah!" });
        }

        // 4. Buat Token (JWT)
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, level: user.current_level }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' } // Token berlaku selama 1 hari
        );

        // 5. Berikan respons sukses beserta token
        res.status(200).json({
            status: "success",
            message: "Login berhasil!",
            token: token,
            data: {
                id: user.id,
                nama_lengkap: user.nama_lengkap,
                email: user.email,
                current_level: user.current_level,
                role: user.role
            }
        });

    } catch (error) {
        console.error("❌ Error pada fitur Login:", error);
        res.status(500).json({ message: "Terjadi kesalahan internal pada server." });
    }
};

module.exports = { register, login };