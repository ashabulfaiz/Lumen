const ProgressModel = require('../models/ProgressModel');

const markLessonComplete = async (req, res) => {
    try {
        const userId = req.user.id;
        const { lesson_id } = req.body;

        if (!lesson_id) {
            return res.status(400).json({ message: "Lesson ID must be sent!" });
        }

        const existingProgress = await ProgressModel.checkLessonProgress(userId, lesson_id);

        if (existingProgress.length > 0) {
            await ProgressModel.updateLessonProgress(existingProgress[0].id);
        } else {
            await ProgressModel.insertLessonProgress(userId, lesson_id);
        }

        res.status(200).json({ status: "success", message: "Material progress successfully recorded!" });
    } catch (error) {
        res.status(500).json({ message: "Failed to record material progress", error: error.message });
    }
};

const submitQuizScore = async (req, res) => {
    try {
        const userId = req.user.id;
        const { quizId, score } = req.body;

        if (!quizId || score === undefined) {
            return res.status(400).json({ message: "Quiz ID and Score are required!" });
        }

        await ProgressModel.insertQuizScore(userId, quizId, score);

        res.status(200).json({ status: "success", message: "Quiz score saved successfully." });
    } catch (error) {
        console.error("Error saving quiz score:", error);
        res.status(500).json({ message: "Failed to save quiz score." });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await ProgressModel.getDashboardStats(userId);

        res.status(200).json({
            status: "success",
            data: {
                rata_rata_skor: stats.rata_rata_skor ? parseFloat(stats.rata_rata_skor).toFixed(2) : 0,
                total_kuis_diikuti: stats.total_kuis || 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch dashboard data", error: error.message });
    }
};

const getCompletedLessons = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { level_id } = req.params;
        
        const completedIds = await ProgressModel.getCompletedLessonsByLevel(userId, level_id);
        
        res.status(200).json({ status: "success", data: completedIds });
    } catch (error) {
        console.error("Gagal mengambil progres:", error);
        res.status(500).json({ message: "Gagal mengambil progres", error: error.message });
    }
};

const getUserProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const userInfo = await ProgressModel.getUserInfo(userId);
        if (!userInfo) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const completedLessonIds = await ProgressModel.getCompletedLessons(userId);

        res.status(200).json({
            status: "success",
            data: {
                current_level: userInfo.current_level,
                is_onboarding_complete: userInfo.is_onboarding_complete,
                completed_lesson_ids: completedLessonIds
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user progress", error: error.message });
    }
};

module.exports = { markLessonComplete, submitQuizScore, getDashboardStats, getUserProgress, getCompletedLessons };