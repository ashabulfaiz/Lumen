const axios = require('axios');
const HelpModel = require('../models/HelpModel');

const AI_CHAT_URL = process.env.AI_CHAT_URL || 'http://127.0.0.1:5001';

const sendChatMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { pesan_user, language = 'id' } = req.body;

        if (!pesan_user) {
            return res.status(400).json({ message: 'Pesan tidak boleh kosong!' });
        }

        let respons_ai;
        try {
            const aiRes = await axios.post(`${AI_CHAT_URL}/api/chat`, {
                message: pesan_user,
                language,
            });
            respons_ai =
                aiRes.data.reply ||
                aiRes.data.error ||
                (language === 'en' ? 'No response from AI.' : 'Tidak ada respons dari AI.');
        } catch (aiError) {
            console.error('AI chat error:', aiError.message);
            respons_ai =
                language === 'en'
                    ? 'Sorry, the AI assistant is offline. Run: cd ai && ./start.sh'
                    : 'Maaf, asisten AI sedang offline. Jalankan: cd ai && ./start.sh';
        }

        await HelpModel.saveChatHistory(userId, pesan_user, respons_ai);

        res.status(200).json({
            status: 'success',
            message: 'Pesan berhasil diproses',
            data: {
                pesan_user,
                respons_ai,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memproses pesan AI', error: error.message });
    }
};

const getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await HelpModel.getChatHistoryByUserId(userId);

        res.status(200).json({
            status: 'success',
            data: history,
        });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil riwayat chat', error: error.message });
    }
};

module.exports = { sendChatMessage, getChatHistory };
