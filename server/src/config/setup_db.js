require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
    try {
        console.log("⏳ Memulai proses setup database LUMEN...");

        // 1. Koneksi awal ke MySQL TANPA memilih database (untuk membuat DB jika belum ada)
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });

        // 2. Buat Database
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME};`);
        console.log(`✅ Database '${process.env.DB_NAME}' berhasil dipastikan ada.`);

        // 3. Gunakan Database tersebut
        await connection.query(`USE ${process.env.DB_NAME};`);

        // 4. Eksekusi pembuatan tabel secara berurutan (Perhatikan urutan karena Foreign Key)
        
        // --- KELOMPOK PENGGUNA ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama_lengkap VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                current_level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
                role ENUM('student', 'admin') DEFAULT 'student',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Tabel 'users' berhasil dibuat.");

        // --- KELOMPOK PEMBELAJARAN ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS languages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama_bahasa VARCHAR(100) NOT NULL,
                deskripsi TEXT,
                image_url VARCHAR(255)
            )
        `);
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS levels (
                id INT AUTO_INCREMENT PRIMARY KEY,
                language_id INT,
                nama_level ENUM('Beginner', 'Intermediate', 'Advanced'),
                urutan INT,
                FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                level_id INT,
                judul_course VARCHAR(255) NOT NULL,
                konten_introduction TEXT,
                urutan INT,
                FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS lessons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT,
                judul_lesson VARCHAR(255) NOT NULL,
                tipe_konten ENUM('Text', 'Video', 'Audio'),
                isi_materi TEXT,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);
        console.log("✅ Tabel kelompok 'pembelajaran' berhasil dibuat.");

        // --- KELOMPOK KUIS & EVALUASI ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS quizzes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NULL,
                level_id INT NULL,
                tipe_quiz ENUM('Placement', 'Course'),
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                quiz_id INT,
                pertanyaan TEXT NOT NULL,
                tipe_soal ENUM('Pilihan Ganda', 'Isian'),
                FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS options (
                id INT AUTO_INCREMENT PRIMARY KEY,
                question_id INT,
                teks_pilihan TEXT NOT NULL,
                is_correct BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
            )
        `);
        console.log("✅ Tabel kelompok 'kuis' berhasil dibuat.");

        // --- KELOMPOK PROGRES & SERTIFIKASI ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                lesson_id INT,
                is_completed BOOLEAN DEFAULT FALSE,
                last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS quiz_scores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                quiz_id INT,
                skor DECIMAL(5,2),
                waktu_pengerjaan INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS chat_histories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                pesan_user TEXT,
                respons_ai TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS certificates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                level_id INT,
                certificate_code VARCHAR(100) UNIQUE,
                issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE
            )
        `);
        console.log("✅ Tabel kelompok 'progres dan sertifikasi' berhasil dibuat.");

        // Tutup koneksi setelah selesai
        await connection.end();
        console.log("🎉 Setup Database LUMEN Selesai! Semua tabel siap digunakan.");

    } catch (error) {
        console.error("❌ Terjadi kesalahan saat setup database:");
        console.error(error);
    }
}

// Jalankan fungsi
setupDatabase();