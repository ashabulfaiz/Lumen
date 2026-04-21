const db = require('../config/database');

// 1. Logika Klaim/Penerbitan Sertifikat
const claimCertificate = async (req, res) => {
    try {
        const userId = req.user.id;
        const { level_id } = req.body;

        if (!level_id) {
            return res.status(400).json({ message: "ID Level wajib disertakan!" });
        }

        // LAPIS 1: Cek apakah sertifikat sudah pernah diklaim sebelumnya (Anti-Duplikat)
        const [existingCert] = await db.query(
            'SELECT * FROM certificates WHERE user_id = ? AND level_id = ?',
            [userId, level_id]
        );

        if (existingCert.length > 0) {
            return res.status(200).json({
                status: "success",
                message: "Sertifikat sudah pernah diterbitkan.",
                data: existingCert[0]
            });
        }

        // LAPIS 2: Validasi Kelayakan (Cek apakah sudah lulus 3 course di level ini)
        // Kita hitung jumlah kuis course unik yang nilainya >= 70
        const [syarat] = await db.query(`
            SELECT COUNT(DISTINCT q.course_id) as total_lulus
            FROM quiz_scores qs
            JOIN quizzes q ON qs.quiz_id = q.id
            JOIN courses c ON q.course_id = c.id
            WHERE qs.user_id = ? AND c.level_id = ? AND qs.skor >= 70
        `, [userId, level_id]);

        const totalLulus = syarat[0].total_lulus;

        if (totalLulus < 3) {
            return res.status(403).json({ 
                status: "error", 
                message: `Belum memenuhi syarat. Anda baru menyelesaikan ${totalLulus} dari 3 Course yang diwajibkan.`
            });
        }

        // LAPIS 3: Generate Kode Unik dan Terbitkan (Traceability)
        const uniqueCode = `LUMEN-CERT-${level_id}${userId}-${Date.now().toString().slice(-6)}`;

        await db.query(
            'INSERT INTO certificates (user_id, level_id, certificate_code) VALUES (?, ?, ?)',
            [userId, level_id, uniqueCode]
        );

        // Ambil data detail untuk dikembalikan ke frontend
        const [newCert] = await db.query(
            'SELECT * FROM certificates WHERE certificate_code = ?',
            [uniqueCode]
        );

        res.status(201).json({
            status: "success",
            message: "Selamat! Sertifikat berhasil diterbitkan.",
            data: newCert[0]
        });

    } catch (error) {
        res.status(500).json({ message: "Gagal menerbitkan sertifikat", error: error.message });
    }
};

// 2. Mengambil semua sertifikat milik pengguna
const getMyCertificates = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [certificates] = await db.query(`
            SELECT c.certificate_code, c.issued_at, l.nama_level, lang.nama_bahasa
            FROM certificates c
            JOIN levels l ON c.level_id = l.id
            JOIN languages lang ON l.language_id = lang.id
            WHERE c.user_id = ?
            ORDER BY c.issued_at DESC
        `, [userId]);

        res.status(200).json({
            status: "success",
            data: certificates
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data sertifikat", error: error.message });
    }
};

module.exports = { claimCertificate, getMyCertificates };