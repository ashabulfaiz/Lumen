const AuthModel = require('../models/AuthModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { nama_lengkap, email, password, current_level } = req.body;

        if (!nama_lengkap || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required!" });
        }

        const existingUser = await AuthModel.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: "Email is already registered, please use another email." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const level = current_level || 'Beginner';
        const role = 'student';
        const result = await AuthModel.createUser(nama_lengkap, email, hashedPassword, level, role);

        res.status(201).json({
            status: "success",
            message: "Registration successful! Please login.",
            data: {
                id: result.insertId,
                nama_lengkap: nama_lengkap,
                email: email,
                current_level: level,
                role: role
            }
        });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "An error occurred on the server.", error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required!" });
        }

        const user = await AuthModel.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: "Email not found." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password." });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, level: user.current_level, is_onboarding_complete: user.is_onboarding_complete },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            status: "success",
            message: "Login successful!",
            token: token,
            data: {
                id: user.id,
                nama_lengkap: user.nama_lengkap,
                email: user.email,
                current_level: user.current_level,
                role: user.role,
                is_onboarding_complete: user.is_onboarding_complete
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "An error occurred while logging in.", error: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await AuthModel.findUserByEmail(req.user.email);
        if (!user) {
            return res.status(404).json({ message: "Account not found. It might have been deleted." });
        }
        res.status(200).json({
            status: "success",
            data: { id: user.id, nama_lengkap: user.nama_lengkap, email: user.email, role: user.role, is_onboarding_complete: user.is_onboarding_complete }
        });
    } catch (error) {
        res.status(500).json({ message: "An error occurred on the server.", error: error.message });
    }
};

module.exports = { register, login, getMe };