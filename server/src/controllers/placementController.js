const PlacementModel = require('../models/PlacementModel');

// Question id ranges map to difficulty bands (see curriculumSeed placement data):
// 1-33 beginner, 34-66 intermediate, 67-100 advanced.
const difficultyFromId = (id) => (id <= 33 ? 1 : id <= 66 ? 2 : 3);

const getPlacementQuestions = async (req, res) => {
    try {
        const questions = await PlacementModel.getRandomQuestions();

        const formattedQuestions = questions.map(q => ({
            id: q.id,
            prompt: q.pertanyaan,
            options: [q.pilihan_a, q.pilihan_b, q.pilihan_c, q.pilihan_d].filter(Boolean),
            answer: q.jawaban_benar,
            difficulty: difficultyFromId(q.id),
            explanation: "The correct answer is:" + q.jawaban_benar
        }));

        res.status(200).json({ status: "success", data: formattedQuestions });
    } catch (error) {
        console.error("Error taking placement questions:", error);
        res.status(500).json({ message: "Failed to retrieve question data from server." });
    }
};

const savePlacementResult = async (req, res) => {
    try {
        const userId = req.user.id;
        const { score, recommendedLevel, answers } = req.body;

        if (score === undefined || recommendedLevel === undefined) {
            return res.status(400).json({
                status: "error",
                message: "Score data and recommended Level must be submitted."
            });
        }

        let determinedLevel = 'Beginner';
        if (recommendedLevel === 3) determinedLevel = 'Advanced';
        else if (recommendedLevel === 2) determinedLevel = 'Intermediate';

        await PlacementModel.updateUserLevel(userId, determinedLevel);
        await PlacementModel.savePlacementScore(userId, score);

        if (answers && Object.keys(answers).length > 0) {
            const detailValues = Object.entries(answers).map(([qId, choice]) => {
                return [userId, qId, choice]; 
            });
            await PlacementModel.saveUserAnswers(detailValues);
        }

        res.status(200).json({
            status: "success",
            message: "Placement Test results and answer details have been saved successfully.",
            data: {
                level_baru: determinedLevel,
                skor_tersimpan: score
            }
        });

    } catch (error) {
        console.error("Error saving placement results:", error);
        res.status(500).json({ status: "error", message: "An internal server error occurred." });
    }
};

const getMyPlacementResult = async (req, res) => {
    try {
        const userId = req.user.id;
        const score = await PlacementModel.getPlacementScore(userId);
        
        if (score === null) {
            return res.status(404).json({ message: "Placement test belum diambil." });
        }

        const rawAnswers = await PlacementModel.getUserPlacementAnswers(userId);
        
        const selectedOptions = {};
        const placementQuestions = rawAnswers.map(ans => {
            selectedOptions[ans.id] = ans.user_answer;
            return {
                id: ans.id,
                prompt: ans.prompt,
                options: [ans.pilihan_a, ans.pilihan_b, ans.pilihan_c, ans.pilihan_d].filter(Boolean),
                answer: ans.answer,
                explanation: "The correct answer is: " + ans.answer
            };
        });

        let recommendedLevel = 1;
        if (score >= 70) recommendedLevel = 3;
        else if (score >= 50) recommendedLevel = 2;

        res.status(200).json({
            status: "success",
            data: {
                result: { score, correctAnswers: rawAnswers.filter(a => a.user_answer === a.answer).length, recommendedLevel },
                selectedOptions,
                placementQuestions
            }
        });
    } catch (error) {
        console.error("Error fetching placement results:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = { getPlacementQuestions, savePlacementResult, getMyPlacementResult };