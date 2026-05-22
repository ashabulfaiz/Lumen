"""
app.py — LUMEN Data Science Service
=====================================
Flask microservice untuk kebutuhan Data Science tim LUMEN.
Berjalan di port 5002, terpisah dari ai-service (port 5001).

Endpoint:
  GET  /api/ds/health                    → Health check
  POST /api/ds/performance               → Analitik performa siswa
  POST /api/ds/recommend-level           → Rekomendasi level naik kelas
  GET  /api/ds/curriculum/<level>        → Kurikulum per level
  GET  /api/ds/curriculum/all            → Ringkasan semua level
  GET  /api/ds/report/<user_id>          → Laporan lengkap siswa

Tim Data Science bebas menambahkan endpoint baru di file ini.
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import json

# Import services DS
from services.performance_service import get_performance
from services.level_recommender   import recommend_level
from services.content_curator     import get_curriculum, get_all_curricula

# ----------------------------------------------------------------
load_dotenv()
app = Flask(__name__)
CORS(app)
# ----------------------------------------------------------------


# ================================================================
# HEALTH CHECK
# ================================================================
@app.route('/api/ds/health', methods=['GET'])
def health_check():
    """Endpoint untuk memastikan ds-service berjalan normal."""
    return jsonify({
        "status" : "ok",
        "service": "LUMEN Data Science Service",
        "port"   : os.getenv("DS_PORT", 5002),
        "version": "1.0.0"
    })


# ================================================================
# 1. ANALITIK PERFORMA SISWA
# ================================================================
@app.route('/api/ds/performance', methods=['POST'])
def performance():
    """
    Menganalisis performa belajar siswa.
    
    Body: { "user_id": 1 }
    """
    data    = request.get_json()
    user_id = data.get("user_id") if data else None

    if not user_id:
        return jsonify({"error": "user_id wajib disertakan."}), 400

    try:
        result = get_performance(int(user_id))
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ================================================================
# 2. REKOMENDASI LEVEL (HYBRID RULE + ML)
# ================================================================
@app.route('/api/ds/recommend-level', methods=['POST'])
def recommend():
    """
    Menentukan apakah siswa siap naik level.
    
    Body: { "user_id": 1 }
    """
    data    = request.get_json()
    user_id = data.get("user_id") if data else None

    if not user_id:
        return jsonify({"error": "user_id wajib disertakan."}), 400

    try:
        result = recommend_level(int(user_id))
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ================================================================
# 3. KURIKULUM PER LEVEL
# ================================================================
@app.route('/api/ds/curriculum/all', methods=['GET'])
def curriculum_all():
    """Ringkasan kurikulum untuk semua 3 level sekaligus."""
    try:
        result = get_all_curricula()
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/ds/curriculum/<string:level>', methods=['GET'])
def curriculum(level):
    """
    Kurikulum lengkap (courses + lessons) untuk satu level.
    
    Contoh: GET /api/ds/curriculum/Beginner
    """
    try:
        result = get_curriculum(level)
        if "error" in result:
            return jsonify({"status": "error", "message": result["error"]}), 404
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ================================================================
# 4. LAPORAN LENGKAP SISWA (GABUNGAN PERFORMA + REKOMENDASI)
# ================================================================
@app.route('/api/ds/report/<int:user_id>', methods=['GET'])
def full_report(user_id):
    """
    Laporan lengkap: performa + rekomendasi level dalam satu endpoint.
    Digunakan untuk halaman profil/progress di frontend React.
    
    Contoh: GET /api/ds/report/1
    """
    try:
        performa      = get_performance(user_id)
        rekomendasi   = recommend_level(user_id)

        return jsonify({
            "status": "success",
            "data"  : {
                "performa"    : performa,
                "rekomendasi" : rekomendasi,
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ================================================================
# 5. ENDPOINT DATASET KUIS (DIBUTUHKAN OLEH BACKEND NODE.JS)
# ================================================================
@app.route('/api/ds/quiz/<string:level>', methods=['GET'])
def get_quiz(level):
    """
    Endpoint untuk mengambil soal kuis berdasarkan level (Beginner, Intermediate, Advanced).
    Membaca langsung dari file dataset JSON.
    """
    try:
        file_path = f"{level}.json"
        
        if not os.path.exists(file_path):
            return jsonify({"status": "error", "message": f"Dataset kuis untuk level '{level}' tidak ditemukan."}), 404
            
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        return jsonify({"status": "success", "data": data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
# ================================================================
# ENTRY POINT
# ================================================================
if __name__ == '__main__':
    port = int(os.getenv("DS_PORT", 5002))
    print(f"[DS-Service] LUMEN Data Science Service berjalan di http://localhost:{port}")
    print(f"   Endpoints tersedia:")
    print(f"   GET  /api/ds/health")
    print(f"   POST /api/ds/performance")
    print(f"   POST /api/ds/recommend-level")
    print(f"   GET  /api/ds/curriculum/<level>")
    print(f"   GET  /api/ds/curriculum/all")
    print(f"   GET  /api/ds/report/<user_id>")
    app.run(debug=True, port=port)
