const axios = require('axios');
const QuizModel = require('../models/QuizModel');
const ProgressModel = require('../models/ProgressModel');

const generateQuiz = async (req, res) => {
    try {
        const { level_name, lesson_id, kategori_topik } = req.body; 

        if (!level_name || !lesson_id || !kategori_topik) {
            return res.status(400).json({ message: "level_name, lesson_id, and topic_category are required fields!" });
        }

        const dsUrl = `http://127.0.0.1:5002/api/ds/quiz/${level_name}`;
        const dsResponse = await axios.get(dsUrl);
        const allTopics = dsResponse.data.data;

        const targetTopic = allTopics.find(t => t.kategori_topik === kategori_topik);

        if (!targetTopic) {
            return res.status(404).json({ message: "Topic not found in the dataset." });
        }

        const quizId = await QuizModel.getOrCreateQuiz(lesson_id, targetTopic.judul_asli);

        const safeQuestionsForFrontend = [];

        for (let q of targetTopic.daftar_soal) {
            if (!Array.isArray(q.pilihan) || q.pilihan.length === 0) {
                continue;
            }

            const questionId = await QuizModel.saveQuestionCache(quizId, q.pertanyaan, q.jawaban_benar);

            safeQuestionsForFrontend.push({
                question_id: questionId,
                pertanyaan: q.pertanyaan,
                pilihan: q.pilihan
            });
        }

        res.status(200).json({
            status: "success",
            message: "Successfully prepared the quiz.",
            data: {
                quiz_id: quizId,
                judul_kuis: targetTopic.judul_asli,
                jumlah_soal: targetTopic.jumlah_soal,
                soal: safeQuestionsForFrontend
            }
        });

    } catch (error) {
        console.error("Error fetching quiz from Data Science:", error);
        res.status(500).json({ message: "An error occurred while generating the quiz.", error: error.message });
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
            const isCorrect = dbQuestion && dbQuestion.jawaban_benar === answer.jawaban;
            
            if (isCorrect) {
                correctCount++;
            }

            await QuizModel.saveUserAnswer(userId, answer.question_id, answer.jawaban, isCorrect);
        }

        const finalScore = (correctCount / totalQuestions) * 100;

        await ProgressModel.insertQuizScore(userId, quiz_id, finalScore);

        res.status(200).json({
            status: "success",
            message: "Quiz submitted and graded successfully.",
            data: {
                correct_answers: correctCount,
                total_questions: totalQuestions,
                final_score: finalScore.toFixed(2)
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Failed to process quiz results.", error: error.message });
    }
};

const getQuizReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const quizId = parseInt(req.params.quizId);

        if (!quizId) {
            return res.status(400).json({ message: "quiz_id is required!" });
        }

        const answers = await QuizModel.getUserAnswers(userId, quizId);
        res.status(200).json({
            status: "success",
            data: answers
        });
    } catch (error) {
        console.error("Error retrieving quiz review:", error);
        res.status(500).json({ message: "Failed to retrieve quiz review.", error: error.message });
    }
};

module.exports = { generateQuiz, submitQuiz, getQuizReview };