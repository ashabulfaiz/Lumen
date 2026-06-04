const path = require('path');
const fs = require('fs');
const QuizModel = require('../models/QuizModel');
const ProgressModel = require('../models/ProgressModel');
const LearningModel = require('../models/LearningModel');

const generateQuiz = async (req, res) => {
    try {
        const { level_name, lesson_id } = req.body;

        if (!level_name || !lesson_id) {
            return res.status(400).json({ message: "level_name and lesson_id are required fields!" });
        }

        const targetLesson = await LearningModel.getLessonById(lesson_id);

        if (!targetLesson) {
            return res.status(404).json({ message: "Lesson tidak ditemukan di database." });
        }

        const topikId = targetLesson.kuis_topik_id || targetLesson.judul_lesson;
        const jsonPath = path.join(__dirname, `../data/dummy_quizzes.json`);

        if (!fs.existsSync(jsonPath)) {
            return res.status(404).json({ message: `File dummy_quizzes.json tidak ditemukan.` });
        }

        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const allQuizzesData = JSON.parse(rawData);
        const activeQuizTemplate = allQuizzesData[topikId];

        if (!activeQuizTemplate) {
            return res.status(404).json({ message: `Topic not found in dummy_quizzes.json: ${topikId}` });
        }

        const quizId = await QuizModel.getOrCreateQuiz(lesson_id, activeQuizTemplate.judul_kuis);
        const shuffledQuestions = [...activeQuizTemplate.daftar_soal].sort(() => 0.5 - Math.random());
        const limitedQuestions = shuffledQuestions.slice(0, 10);
        const soalFormat = [];

        for (const rawSoal of limitedQuestions) {
            const questionId = await QuizModel.saveQuestionCache(quizId, rawSoal.pertanyaan, rawSoal.jawaban_benar);
            soalFormat.push({
                question_id: questionId,
                pertanyaan: rawSoal.pertanyaan,
                pilihan: rawSoal.pilihan
            });
        }

        res.status(200).json({
            status: "success",
            message: "Successfully prepared the quiz.",
            data: {
                quiz_id: quizId,
                judul_kuis: activeQuizTemplate.judul_kuis,
                pass_threshold: ProgressModel.QUIZ_PASS_PERCENT,
                soal: soalFormat
            }
        });

    } catch (error) {
        console.error("Error generating quiz:", error);
        res.status(500).json({ message: "An error occurred while generating the quiz.", error: error.message });
    }
};

const submitQuiz = async (req, res) => {
    try {
        const userId = req.user.id;
        const { quiz_id, user_answers } = req.body;

        let correctCount = 0;
        const totalQuestions = user_answers.length;

        await QuizModel.clearUserAnswersByQuiz(userId, quiz_id);

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

        const passThreshold = ProgressModel.QUIZ_PASS_PERCENT;
        const passed = finalScore >= passThreshold;

        res.status(200).json({
            status: "success",
            message: "Quiz submitted and graded successfully.",
            data: {
                correct_answers: correctCount,
                total_questions: totalQuestions,
                final_score: finalScore.toFixed(2),
                pass_threshold: passThreshold,
                passed
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