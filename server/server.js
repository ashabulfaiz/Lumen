require('./src/config/loadEnv');
const express = require('express');
const cors = require('cors');
const db = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const learningRoutes = require('./src/routes/learningRoutes');
const { errorHandler } = require('./src/middlewares/errorHandler');
const progressRoutes = require('./src/routes/progressRoutes');
const helpRoutes = require('./src/routes/helpRoutes');
const certificateRoutes = require('./src/routes/certificateRoutes');
const placementRoutes = require('./src/routes/placementRoutes');
const quizRoutes = require('./src/routes/quizRoutes');
const grammarRoutes = require('./src/routes/grammarRoutes');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ status: 'success', message: 'Selamat datang di LUMEN API!' });
});

app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT nama_lengkap, email FROM users');
        res.json({
            status: 'success',
            message: 'Database berhasil diakses!',
            data_users: rows,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Gagal mengambil data',
            error: error.message,
        });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/placement', placementRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/grammar', grammarRoutes);

app.use((req, res, next) => {
    const error = new Error(`Route tidak ditemukan - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await db.waitForDatabase();
    } catch {
        console.warn('⚠️ Server starting without database — check .env and MySQL.');
    }

    app.listen(PORT, () => {
        console.log(`🚀 Server LUMEN berhasil berjalan di http://localhost:${PORT}`);
    });
}

startServer();
