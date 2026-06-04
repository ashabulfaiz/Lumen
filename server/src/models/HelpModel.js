const db = require('../config/database');

class HelpModel {
    static async saveChatHistory(userId, pesan_user, respons_ai) {
        const [result] = await db.query(
            'INSERT INTO chat_histories (user_id, pesan_user, respons_ai) VALUES (?, ?, ?)',
            [userId, pesan_user, respons_ai]
        );
        return result;
    }

    static async getChatHistoryByUserId(userId) {
        const [rows] = await db.query(
            'SELECT pesan_user, respons_ai, created_at FROM chat_histories WHERE user_id = ? ORDER BY created_at ASC',
            [userId]
        );
        return rows;
    }
}

module.exports = HelpModel;