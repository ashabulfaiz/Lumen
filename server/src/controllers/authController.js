const AuthModel = require('../models/AuthModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { nama_lengkap, email, password, current_level } = req.body;

        if (!nama_lengkap || !email || !password) {
            return res.status(400).json({ message: "Nama, email, dan password wajib diisi!" });
        }

        const existingUser = await AuthModel.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: "Email sudah terdaftar, silakan gunakan email lain." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const level = current_level || 'Beginner';
        const role = 'student';
        const result = await AuthModel.createUser(nama_lengkap, email, hashedPassword, level, role);

        res.status(201).json({
            status: "success",
            message: "Registrasi berhasil! Silakan login.",
            data: {
                id: result.insertId,
                nama_lengkap: nama_lengkap,
                email: email,
                current_level: level,
                role: role
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email dan password wajib diisi!" });
        }

        const user = await AuthModel.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: "Email tidak ditemukan." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Password salah!" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, level: user.current_level },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

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
        res.status(500).json({ message: "Terjadi kesalahan saat login.", error: error.message });
    }
};

module.exports = { register, login };