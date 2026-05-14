const mysql = require('mysql2/promise');
require('dotenv').config();

// Membuat connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Maksimal 10 koneksi bersamaan
    queueLimit: 0
});

// Mengetes koneksi saat file ini dipanggil
pool.getConnection()
    .then(conn => {
        console.log("✅ Terhubung ke database MySQL (LUMEN)!");
        conn.release();
    })
    .catch(err => {
        console.error("❌ Gagal terhubung ke database:", err.message);
    });

module.exports = pool;