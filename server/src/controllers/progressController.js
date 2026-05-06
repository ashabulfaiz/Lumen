const db = require('../config/database');

// 1. Mencatat bahwa sebuah materi (lesson) sudah selesai dibaca/ditonton
const markLessonComplete = async (req, res) => {
    try {
        const userId = req.user.id; // Didapat dari verifyToken
        const { lesson_id } = req.body;

        if (!lesson_id) {
            return res.status(400).json({ message: "ID Lesson wajib dikirim!" });
        }

        // Cek apakah sudah pernah dicatat sebelumnya
        const [existing] = await db.query(
            'SELECT * FROM user_progress WHERE user_id = ? AND lesson_id = ?',
            [userId, lesson_id]
        );

        if (existing.length > 0) {
            // Jika sudah ada, update last_accessed dan pastikan is_completed = true
            await db.query(
                'UPDATE user_progress SET is_completed = true, last_accessed = CURRENT_TIMESTAMP WHERE id = ?',
                [existing[0].id]
            );
        } else {
            // Jika belum ada, buat record baru
            await db.query(
                'INSERT INTO user_progress (user_id, lesson_id, is_completed) VALUES (?, ?, true)',
                [userId, lesson_id]
            );
        }

        res.status(200).json({ status: "success", message: "Progres materi berhasil dicatat!" });
    } catch (error) {
        res.status(500).json({ message: "Gagal mencatat progres materi", error: error.message });
    }
};

// 2. Mengirim dan menyimpan nilai kuis
const submitQuizScore = async (req, res) => {
    try {
        const userId = req.user.id;
        const { quiz_id, skor, waktu_pengerjaan } = req.body;

        if (!quiz_id || skor === undefined || waktu_pengerjaan === undefined) {
            return res.status(400).json({ message: "Data kuis tidak lengkap!" });
        }

        await db.query(
            'INSERT INTO quiz_scores (user_id, quiz_id, skor, waktu_pengerjaan) VALUES (?, ?, ?, ?)',
            [userId, quiz_id, skor, waktu_pengerjaan]
        );

        res.status(201).json({ status: "success", message: "Nilai kuis berhasil disimpan! AI sedang menganalisis..." });
    } catch (error) {
        res.status(500).json({ message: "Gagal menyimpan nilai kuis", error: error.message });
    }
};

// 3. Mengambil statistik user untuk halaman Dashboard frontend
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Hitung total materi yang sudah diselesaikan
        const [progressCount] = await db.query(
            'SELECT COUNT(*) as total_completed FROM user_progress WHERE user_id = ? AND is_completed = true',
            [userId]
        );

        // Ambil nilai rata-rata kuis
        const [scoreStats] = await db.query(
            'SELECT AVG(skor) as rata_rata_skor, COUNT(*) as total_kuis FROM quiz_scores WHERE user_id = ?',
            [userId]
        );

        res.status(200).json({
            status: "success",
            data: {
                materi_selesai: progressCount[0].total_completed,
                rata_rata_skor: scoreStats[0].rata_rata_skor ? parseFloat(scoreStats[0].rata_rata_skor).toFixed(2) : 0,
                total_kuis_diikuti: scoreStats[0].total_kuis
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data dashboard", error: error.message });
    }
};

module.exports = { markLessonComplete, submitQuizScore, getDashboardStats };