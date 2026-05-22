const CertificateModel = require('../models/CertificateModel');

const claimCertificate = async (req, res) => {
    try {
        const userId = req.user.id;
        const { level_id } = req.body;

        if (!level_id) {
            return res.status(400).json({ message: "ID Level wajib disertakan!" });
        }

        const existingCert = await CertificateModel.checkExistingCertificate(userId, level_id);
        if (existingCert) {
            return res.status(200).json({
                status: "success",
                message: "Sertifikat sudah pernah diterbitkan.",
                data: existingCert
            });
        }

        const totalLulus = await CertificateModel.countPassedCourses(userId, level_id);
        const totalCourse = await CertificateModel.countTotalCoursesInLevel(level_id);

        if (totalCourse === 0) {
            return res.status(400).json({ message: "Level ini belum memiliki materi/course." });
        }

        if (totalLulus < totalCourse) {
            return res.status(403).json({ 
                message: `Anda belum memenuhi syarat. Baru lulus ${totalLulus} dari ${totalCourse} course di level ini.` 
            });
        }

        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        const uniqueCode = `LUMEN-${level_id}-${randomString}-${Date.now().toString().slice(-6)}`;
        const newCert = await CertificateModel.createCertificate(userId, level_id, uniqueCode);

        res.status(201).json({
            status: "success",
            message: "Selamat! Sertifikat berhasil diterbitkan.",
            data: newCert
        });

    } catch (error) {
        res.status(500).json({ message: "Gagal menerbitkan sertifikat", error: error.message });
    }
};

const getMyCertificates = async (req, res) => {
    try {
        const userId = req.user.id;
        const certificates = await CertificateModel.getUserCertificates(userId);

        res.status(200).json({
            status: "success",
            data: certificates
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data sertifikat", error: error.message });
    }
};

module.exports = { claimCertificate, getMyCertificates };