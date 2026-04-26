import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app) 

# ========================================================
# 1. INISIALISASI GEMINI
# ========================================================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

try:
    if not GEMINI_API_KEY:
        raise ValueError("API Key tidak ditemukan di file .env!")
        
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    print("🤖 Gemini Client bersiap-siap dengan aman!")
except Exception as e:
    print(f"⚠️ Gagal inisialisasi Gemini. Error: {e}")
    gemini_client = None

# ========================================================
# 2. ENDPOINT SEMANTIC (MODE SIMULASI TANPA TENSORFLOW)
# ========================================================
@app.route('/api/check-semantic', methods=['POST'])
def check_semantic():
    data = request.json
    return jsonify({
        "similarity_score": 0.88, 
        "status": "Correct", 
        "feedback": "Mode Simulasi: API berjalan sempurna!"
    })

# ========================================================
# 3. ENDPOINT CHATBOT HYBRID (GEMINI -> FALLBACK RULE-BASED)
# ========================================================
@app.route('/api/chat', methods=['POST'])
def chat_assistant():
    data = request.json
    user_message = data.get('message', '').lower()

    if not user_message:
        return jsonify({"error": "Pesan kosong"}), 400

    # --------------------------------------------------------
    # RENCANA A: COBA GUNAKAN GEMINI API
    # --------------------------------------------------------
    if gemini_client and GEMINI_API_KEY != "AIzaSyB7-wYpfxDu8J5Ovj1v8K5idybAY5I63_":
        try:
            system_instruction = """
            Kamu adalah LUMEN-bot, asisten AI di aplikasi belajar bahasa Inggris LUMEN.
            Jawab singkat, ramah, campur bahasa Indonesia-Inggris, dan fokus pada bahasa Inggris saja.
            """
            full_prompt = f"{system_instruction}\n\nPengguna: {user_message}\nLUMEN-bot:"
            
            response = gemini_client.models.generate_content(
                model='gemini-2.0-flash',
                contents=full_prompt
            )
            # Jika berhasil, langsung kirim jawaban Gemini dan hentikan proses di sini
            return jsonify({"reply": response.text})
        
        except Exception as e:
            # Jika kuota habis (429) atau error internet, kita TANGKAP error-nya
            # dan biarkan program berlanjut ke Rencana B di bawah.
            print(f"⚠️ Gemini API gagal (kemungkinan kuota habis): {e}")
            print("🔄 Beralih ke Mode Rule-Based otomatis...")

    # --------------------------------------------------------
    # RENCANA B: FALLBACK KE RULE-BASED (JIKA GEMINI GAGAL/HABIS KUOTA)
    # --------------------------------------------------------
    reply = "Maaf, AI utamaku sedang kehabisan energi (kuota harian habis). Tapi aku masih bisa menjawab sapaan atau dasar grammar!"
    
    if any(word in user_message for word in ['halo', 'hai', 'hello', 'hi']):
        reply = "Halo! Aku LUMEN-bot (Mode Offline). Ada yang bisa kubantu seputar bahasa Inggris hari ini?"
    elif any(word in user_message for word in ['bedanya in', 'in on at']):
        reply = "Singkatnya:\n- **IN**: Untuk ruang (in the box)\n- **ON**: Untuk permukaan/hari (on the table)\n- **AT**: Untuk waktu (at 8 PM)"
    elif any(word in user_message for word in ['grammar', 'tenses']):
        reply = "Grammar memang menantang! Pastikan kamu memahami Present Tense dulu ya."

    # Mengembalikan jawaban Rule-Based
    return jsonify({"reply": reply})

if __name__ == '__main__':
    app.run(debug=True, port=5001)