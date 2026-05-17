"""
utils/db.py
===========
Koneksi ke database MySQL LUMEN.
ds-service hanya melakukan operasi READ (SELECT) — tidak menulis data.
Penulisan data tetap menjadi tanggung jawab Node.js server.
"""

import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    """
    Membuat dan mengembalikan koneksi baru ke database MySQL.
    Panggil fungsi ini di setiap service, lalu tutup setelah selesai.
    """
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "lumen"),
            autocommit=True
        )
        return conn
    except mysql.connector.Error as e:
        raise ConnectionError(f"[DS-Service] Gagal koneksi ke database: {e}")


def query(sql: str, params: tuple = ()):
    """
    Helper untuk menjalankan satu query SELECT dan mengembalikan list of dict.
    
    Contoh:
        rows = query("SELECT * FROM quiz_scores WHERE user_id = %s", (user_id,))
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(sql, params)
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
