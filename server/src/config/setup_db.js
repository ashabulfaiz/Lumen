require('./loadEnv');
const mysql = require('mysql2/promise');

async function setupDatabase() {
    try {
        console.log("⏳ Memulai proses migrasi database LUMEN...");

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });

        await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME};`);
        await connection.query(`CREATE DATABASE ${process.env.DB_NAME};`);
        await connection.query(`USE ${process.env.DB_NAME};`);

        // --- 1. TABEL USERS ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama_lengkap VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                current_level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
                is_onboarding_complete BOOLEAN DEFAULT FALSE,
                role ENUM('student', 'admin') DEFAULT 'student',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // --- 2. TABEL LANGUAGES ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS languages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama_bahasa VARCHAR(100) NOT NULL,
                kode_iso VARCHAR(10) UNIQUE NOT NULL
            )
        `);

        // --- 3. TABEL PLACEMENT QUESTIONS ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS placement_questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                language_id INT,
                pertanyaan TEXT NOT NULL,
                pilihan_a VARCHAR(255),
                pilihan_b VARCHAR(255),
                pilihan_c VARCHAR(255),
                pilihan_d VARCHAR(255),
                jawaban_benar VARCHAR(255),
                FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE
            )
        `);

        // --- 4. HIERARKI MATERI (LEVEL -> COURSE -> LESSON) ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS levels (
                id INT AUTO_INCREMENT PRIMARY KEY,
                language_id INT,
                nama_level VARCHAR(50) NOT NULL,
                urutan INT,
                FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                level_id INT,
                judul_course VARCHAR(255) NOT NULL,
                deskripsi TEXT,
                urutan INT,
                FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS lessons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT,
                judul_lesson VARCHAR(255) NOT NULL,
                konten_teks TEXT,   /* <--- INI ADALAH ISI MATERI */
                video_url VARCHAR(255),
                urutan INT,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);

        // --- 5. STRUKTUR KUIS BARU (QUIZ -> QUESTIONS -> OPTIONS) ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS quizzes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lesson_id INT,
                judul_quiz VARCHAR(255),
                FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
            )
        `);

        // 5. TABEL QUESTIONS
        await connection.query(`
            CREATE TABLE IF NOT EXISTS questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                quiz_id INT,
                ds_question_id VARCHAR(100),
                pertanyaan TEXT NOT NULL,
                jawaban_benar VARCHAR(255) NOT NULL,
                tipe_soal ENUM('multiple_choice', 'essay') DEFAULT 'multiple_choice',
                urutan INT,
                FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
            )
        `);

        // --- 6. TABEL HASIL & PROGRES USER ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS quiz_scores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                quiz_type ENUM('placement', 'module') NOT NULL,
                quiz_id INT NULL, /* Null jika tipe placement, terisi jika tipe module */
                skor FLOAT DEFAULT 0, /* Pakai FLOAT karena nilai bisa desimal saat dinilai AI */
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
            )
        `);

        // Tabel ini dirancang untuk menerima huruf opsi (A,B,C,D) ATAUPUN teks essay panjang
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_answers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                placement_question_id INT NULL,
                question_id INT NULL,
                jawaban_teks TEXT, /* <--- Diubah jadi TEXT agar muat menampung essay */
                is_correct BOOLEAN NULL,
                ai_feedback TEXT NULL, /* <--- Menyimpan koreksi grammar dari AI LUMEN */
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (placement_question_id) REFERENCES placement_questions(id) ON DELETE CASCADE,
                FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                lesson_id INT,
                is_completed BOOLEAN DEFAULT FALSE,
                last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
            )
        `);

        // --- 7. TABEL SISA (Chat & Sertifikat) ---
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

        await connection.query(`
            CREATE TABLE IF NOT EXISTS grammar_correction_histories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                original_input TEXT NOT NULL,
                corrected_output TEXT NOT NULL,
                error_details JSON, /* Menyimpan detail salahnya dimana saja dalam bentuk JSON */
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`INSERT IGNORE INTO languages (id, nama_bahasa, kode_iso) VALUES (1, 'English', 'EN')`);

        await connection.query(`
            INSERT IGNORE INTO placement_questions (id, language_id, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawaban_benar) VALUES
            (1, 1, 'What is the past tense of "go"?', 'goed', 'went', 'gone', 'going', 'went'),
            (2, 1, 'Choose the correct sentence.', 'She do her homework.', 'She does her homework.', 'She doing her homework.', 'She done her homework.', 'She does her homework.'),
            (3, 1, 'Which word is a synonym of "rapid"?', 'Slow', 'Fast', 'Late', 'Heavy', 'Fast'),
            (4, 1, 'Fill in the blank: They ___ to school every day.', 'go', 'goes', 'going', 'gone', 'go'),
            (5, 1, 'Which one is a noun?', 'Beautiful', 'Run', 'Happiness', 'Quickly', 'Happiness'),
            (6, 1, 'What is the comparative form of "good"?', 'Gooder', 'More good', 'Best', 'Better', 'Better'),
            (7, 1, 'Identify the adverb in this sentence: He speaks English fluently.', 'He', 'speaks', 'English', 'fluently', 'fluently'),
            (8, 1, 'Complete the sentence: I have been living here ___ 2015.', 'since', 'for', 'in', 'at', 'since'),
            (9, 1, 'Choose the passive voice form of: "They built this house in 1990."', 'This house built them in 1990.', 'This house was built in 1990.', 'In 1990 they were building this house.', 'This house is built in 1990.', 'This house was built in 1990.'),
            (10, 1, 'What does "break the ice" mean?', 'To freeze water', 'To start a conversation in a tense situation', 'To destroy something cold', 'To be very angry', 'To start a conversation in a tense situation')
        `);

        await connection.end();

        const { seedCurriculum } = require('./seeder');
        await seedCurriculum();

        console.log("✅ Migrasi Database LUMEN Berhasil!.");

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

setupDatabase();