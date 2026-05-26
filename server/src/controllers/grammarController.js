const axios = require('axios');
const GrammarModel = require('../models/GrammarModel');

const checkGrammar = async (req, res) => {
    try {
        const userId = req.user.id;
        const { text } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Teks input kalimat tidak boleh kosong!' 
            });
        }

        let aiResponse;
        try {
            aiResponse = await axios.post('http://localhost:5001/correct', {
                text: text
            });
        } catch (aiError) {
            console.error("AI Service Error:", aiError.message);
            return res.status(502).json({
                status: 'error',
                message: 'Gagal terhubung dengan Layanan AI Koreksi. Pastikan AI Service berjalan.'
            });
        }

        const { corrected, matches } = aiResponse.data;
        await GrammarModel.saveHistory(userId, text, corrected, matches);

        res.status(200).json({
            status: 'success',
            message: 'Kalimat berhasil dianalisis oleh AI.',
            data: {
                original_text: text,
                corrected_text: corrected,
                error_details: matches
            }
        });

    } catch (error) {
        console.error("Error pada grammarController:", error);
        res.status(500).json({ 
            status: 'error',
            message: 'Terjadi kesalahan internal pada server Node.js.', 
            error: error.message 
        });
    }
};

module.exports = {
    checkGrammar
};