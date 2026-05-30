const CertificateModel = require('../models/CertificateModel');

const claimCertificate = async (req, res) => {
    try {
        const userId = req.user.id;
        const { level_id } = req.body;

        if (!level_id) {
            return res.status(400).json({ message: "Level ID is required!" });
        }

        const existingCert = await CertificateModel.checkExistingCertificate(userId, level_id);
        if (existingCert) {
            return res.status(200).json({
                status: "success",
                message: "Certificate has already been issued.",
                data: existingCert
            });
        }

        const totalLulus = await CertificateModel.countPassedLessons(userId, level_id);
        const totalLesson = await CertificateModel.countTotalLessonsInLevel(level_id);

        if (totalLesson === 0) {
            return res.status(400).json({ message: "This level does not yet have any material or lessons to complete." });
        }

        if (totalLulus < totalLesson) {
            return res.status(403).json({ 
                message: `You have not met the requirements. You have only passed ${totalLulus} out of ${totalLesson} lessons in this level.` 
            });
        }

        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        const uniqueCode = `LUMEN-${level_id}-${randomString}-${Date.now().toString().slice(-6)}`;
        const newCert = await CertificateModel.createCertificate(userId, level_id, uniqueCode);

        res.status(201).json({
            status: "success",
            message: "Congratulations! Your certificate of completion has been successfully issued.",
            data: newCert
        });

    } catch (error) {
        res.status(500).json({ message: "Failed to issue certificate", error: error.message });
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
        res.status(500).json({ message: "Failed to retrieve certificate data", error: error.message });
    }
};

module.exports = { claimCertificate, getMyCertificates };