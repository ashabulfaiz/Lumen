require('./loadEnv');
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'lumen';

if (!process.env.DB_NAME) {
    console.warn(`⚠️ DB_NAME tidak ada di .env — memakai default "${DB_NAME}"`);
}

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

pool.getConnection()
    .then((conn) => {
        console.log(`✅ Terhubung ke database MySQL (${DB_NAME})!`);
        conn.release();
    })
    .catch((err) => {
        console.error('❌ Gagal terhubung ke database:', err.message);
    });

module.exports = pool;
