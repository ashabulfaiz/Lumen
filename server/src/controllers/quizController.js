const axios = require('axios');
const QuizModel = require('../models/QuizModel');
const ProgressModel = require('../models/ProgressModel');

const generateQuiz = async (req, res) => {
    try {
        const { level_name, lesson_id, kategori_topik } = req.body; 

        if (!level_name || !lesson_id || !kategori_topik) {
            return res.status(400).json({ message: "level_name, lesson_id, dan kategori_topik wajib diisi!" });
        }

        const dsUrl = `http://127.0.0.1:5002/api/ds/quiz/${level_name}`;
        const dsResponse = await axios.get(dsUrl);
        const allTopics = dsResponse.data.data;

        const targetTopic = allTopics.find(t => t.kategori_topik === kategori_topik);

        if (!targetTopic) {
            return res.status(404).json({ message: "Topik kuis tidak ditemukan di dataset." });
        }

        const quizId = await QuizModel.getOrCreateQuiz(lesson_id, targetTopic.judul_asli);

        const safeQuestionsForFrontend = [];

        for (let q of targetTopic.daftar_soal) {
            const questionId = await QuizModel.saveQuestionCache(quizId, q.pertanyaan, q.jawaban_benar);

            safeQuestionsForFrontend.push({
                question_id: questionId,
                pertanyaan: q.pertanyaan,
                pilihan: q.pilihan
            });
        }

        res.status(200).json({
            status: "success",
            message: "Berhasil menyiapkan kuis.",
            data: {
                quiz_id: quizId,
                judul_kuis: targetTopic.judul_asli,
                jumlah_soal: targetTopic.jumlah_soal,
                soal: safeQuestionsForFrontend
            }
        });

    } catch (error) {
        console.error("Error mengambil kuis dari Data Science:", error);
        res.status(500).json({ message: "Terjadi kesalahan saat meng-generate kuis.", error: error.message });
    }
};

const submitQuiz = async (req, res) => {
    try {
        const userId = req.user.id;
        const { quiz_id, user_answers } = req.body; 

        let correctCount = 0;
        const totalQuestions = user_answers.length;

        for (let answer of user_answers) {
            const dbQuestion = await QuizModel.getCorrectAnswer(answer.question_id);
            if (dbQuestion && dbQuestion.jawaban_benar === answer.jawaban) {
                correctCount++;
            }
        }

        const finalScore = (correctCount / totalQuestions) * 100;

        await ProgressModel.insertQuizScore(userId, quiz_id, finalScore);

        res.status(200).json({
            status: "success",
            message: "Kuis berhasil disubmit dan dinilai.",
            data: {
                jawaban_benar: correctCount,
                total_soal: totalQuestions,
                skor_akhir: finalScore.toFixed(2)
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Gagal memproses hasil kuis.", error: error.message });
    }
};

module.exports = { generateQuiz, submitQuiz };