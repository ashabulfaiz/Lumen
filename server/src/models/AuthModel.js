const db = require('../config/database');

class AuthModel {
    static async findUserByEmail(email) {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async createUser(nama_lengkap, email, password_hash, current_level, role) {
        const [result] = await db.query(
            'INSERT INTO users (nama_lengkap, email, password_hash, current_level, role) VALUES (?, ?, ?, ?, ?)',
            [nama_lengkap, email, password_hash, current_level, role]
        );
        return result;
    }
}

module.exports = AuthModel;