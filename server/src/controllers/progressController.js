const db = require('../config/database');

const markLessonComplete = async (req, res) => {
    try {
        const userId = req.user.id;
        const { lesson_id } = req.body;

        if (!lesson_id) {
            return res.status(400).json({ message: "Lesson ID must be sent!" });
        }

        const [existing] = await db.query(
            'SELECT * FROM user_progress WHERE user_id = ? AND lesson_id = ?',
            [userId, lesson_id]
        );

        if (existing.length > 0) {
            await db.query(
                'UPDATE user_progress SET is_completed = true, last_accessed = CURRENT_TIMESTAMP WHERE id = ?',
                [existing[0].id]
            );
        } else {
            await db.query(
                'INSERT INTO user_progress (user_id, lesson_id, is_completed) VALUES (?, ?, true)',
                [userId, lesson_id]
            );
        }

        res.status(200).json({ status: "success", message: "Material progress successfully recorded!" });
    } catch (error) {
        res.status(500).json({ message: "Failed to record material progress", error: error.message });
    }
};

const submitQuizScore = async (req, res) => {
    try {
        const userId = req.user.id;
        const { lessonId, score, answers } = req.body;

        if (!lessonId) {
            return res.status(400).json({ message: "Lesson ID must be sent!" });
        }

        let quizId = null;
        const [existingQuiz] = await db.query('SELECT id FROM quizzes WHERE lesson_id = ?', [lessonId]);
        
        if (existingQuiz.length > 0) {
            quizId = existingQuiz[0].id;
        } else {
            const [newQuiz] = await db.query(
                'INSERT INTO quizzes (lesson_id, judul_quiz) VALUES (?, ?)', 
                [lessonId, `Quiz for Lesson ${lessonId}`]
            );
            quizId = newQuiz.insertId;
        }

        await db.query(
            'INSERT INTO quiz_scores (user_id, quiz_type, quiz_id, skor) VALUES (?, "module", ?, ?)',
            [userId, quizId, score]
        );

        if (answers && Object.keys(answers).length > 0) {
            const detailValues = Object.entries(answers).map(([questionCode, answerText]) => {
                return [userId, null, null, answerText]; 
            });

            await db.query(
                'INSERT INTO user_answers (user_id, placement_question_id, question_id, jawaban_teks) VALUES ?',
                [detailValues]
            );
        }

        const [existingProgress] = await db.query('SELECT id FROM user_progress WHERE user_id = ? AND lesson_id = ?', [userId, lessonId]);
        if (existingProgress.length > 0) {
            await db.query('UPDATE user_progress SET is_completed = true, last_accessed = CURRENT_TIMESTAMP WHERE id = ?', [existingProgress[0].id]);
        } else {
            await db.query('INSERT INTO user_progress (user_id, lesson_id, is_completed) VALUES (?, ?, true)', [userId, lessonId]);
        }

        res.status(201).json({ status: "success", message: "Quiz and essay scores successfully saved to the database!" });
    } catch (error) {
        console.error("Error submitting quiz:", error);
        res.status(500).json({ message: "Failed to save quiz scores", error: error.message });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const [progressCount] = await db.query(
            'SELECT COUNT(*) as total_completed FROM user_progress WHERE user_id = ? AND is_completed = true',
            [userId]
        );

        const [scoreStats] = await db.query(
            'SELECT AVG(skor) as rata_rata_skor, COUNT(*) as total_kuis FROM quiz_scores WHERE user_id = ?',
            [userId]
        );

        res.status(200).json({
            status: "success",
            data: {
                materi_selesai: progressCount[0].total_completed,
                rata_rata_skor: scoreStats[0].rata_rata_skor ? parseFloat(scoreStats[0].rata_rata_skor).toFixed(2) : 0,
                total_kuis_diikuti: scoreStats[0].total_kuis
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Failed to fetch dashboard data", error: error.message });
    }
};

const getUserProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await db.query('SELECT current_level, is_onboarding_complete FROM users WHERE id = ?', [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const user = users[0];
        const [completedLessons] = await db.query('SELECT lesson_id FROM user_progress WHERE user_id = ? AND is_completed = true', [userId]);

        res.status(200).json({
            status: "success",
            data: {
                current_level: user.current_level,
                is_onboarding_complete: user.is_onboarding_complete,
                completed_lesson_ids: completedLessons.map(row => row.lesson_id)
            }
        });
    } catch (error) {
        console.error("Error fetching user progress:", error);
        res.status(500).json({ message: "Failed to fetch user progress", error: error.message });
    }
};

module.exports = { markLessonComplete, submitQuizScore, getDashboardStats, getUserProgress };