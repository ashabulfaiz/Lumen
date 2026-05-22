const HelpModel = require('../models/HelpModel');

const sendChatMessage = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { pesan_user } = req.body;

        if (!pesan_user) {
            return res.status(400).json({ message: "Pesan tidak boleh kosong!" });
        }

        const respons_ai = `LUMEN AI menjawab: "Saya mengerti maksud Anda terkait '${pesan_user}'. Sistem AI asli sedang dalam tahap integrasi."`;
        await HelpModel.saveChatHistory(userId, pesan_user, respons_ai);

        res.status(200).json({
            status: "success",
            message: "Pesan berhasil diproses",
            data: {
                pesan_user,
                respons_ai
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal memproses pesan AI", error: error.message });
    }
};

const getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await HelpModel.getChatHistoryByUserId(userId);

        res.status(200).json({
            status: "success",
            data: history
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil riwayat chat", error: error.message });
    }
};

module.exports = { sendChatMessage, getChatHistory };