const db = require('../config/database');

const getPlacementQuestions = async (req, res) => {
    try {
        const [questions] = await db.query('SELECT * FROM placement_questions');
        
        const formattedQuestions = questions.map(q => ({
            id: q.id,
            prompt: q.pertanyaan,
            options: [q.pilihan_a, q.pilihan_b, q.pilihan_c, q.pilihan_d].filter(Boolean),
            answer: q.jawaban_benar,
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
        if (recommendedLevel === 3) {
            determinedLevel = 'Advanced';
        } else if (recommendedLevel === 2) {
            determinedLevel = 'Intermediate';
        }

        await db.query(
            'UPDATE users SET current_level = ?, is_onboarding_complete = true WHERE id = ?',
            [determinedLevel, userId]
        );

        await db.query(
            'INSERT INTO quiz_scores (user_id, quiz_type, skor) VALUES (?, "placement", ?)',
            [userId, score]
        );

        if (answers && Object.keys(answers).length > 0) {
            const detailValues = Object.entries(answers).map(([qId, choice]) => {
                return [userId, qId, choice]; 
            });

            await db.query(
                'INSERT INTO user_answers (user_id, placement_question_id, jawaban_teks) VALUES ?', 
                [detailValues]
            );
        }

        res.status(200).json({
            status: "success",
            message: "Placement Test results and answer details have been saved successfully..",
            data: {
                level_baru: determinedLevel,
                skor_tersimpan: score
            }
        });

    } catch (error) {
        console.error("Error saving placement results:", error);
        res.status(500).json({ 
            status: "error", 
            message: "An internal server error occurred.", 
            error: error.message 
        });
    }
};

module.exports = { getPlacementQuestions, savePlacementResult };