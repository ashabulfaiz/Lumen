const db = require('../config/database');

// Fungsi 1: Mengirim pesan dan mendapatkan respons AI
const sendChatMessage = async (req, res) => {
    try {
        const userId = req.user.id; // Dari JWT Token
        const { pesan_user } = req.body;

        if (!pesan_user) {
            return res.status(400).json({ message: "Pesan tidak boleh kosong!" });
        }

        // ---------------------------------------------------------
        // 🤖 AREA INTEGRASI GENERATIVE AI
        // Di sinilah kamu nantinya memanggil API AI (misal: Axios ke FastAPI milik AI Engineer / API eksternal)
        // Sementara kita pakai respons statis (mockup) agar sistem bisa berjalan dulu.
        // ---------------------------------------------------------
        
        // Simulasi proses berpikir AI (bisa dihapus nanti)
        const respons_ai = `LUMEN AI menjawab: "Saya mengerti maksud Anda terkait '${pesan_user}'. Sistem AI asli sedang dalam tahap integrasi."`;

        // Simpan riwayat chat ke database
        await db.query(
            'INSERT INTO chat_histories (user_id, pesan_user, respons_ai) VALUES (?, ?, ?)',
            [userId, pesan_user, respons_ai]
        );

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

// Fungsi 2: Mengambil riwayat percakapan untuk ditampilkan di layar frontend
const getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Ambil riwayat percakapan dari yang terlama ke terbaru
        const [history] = await db.query(
            'SELECT pesan_user, respons_ai, created_at FROM chat_histories WHERE user_id = ? ORDER BY created_at ASC',
            [userId]
        );

        res.status(200).json({
            status: "success",
            data: history
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil riwayat chat", error: error.message });
    }
};

module.exports = { sendChatMessage, getChatHistory };