import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq 
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app) 

# ========================================================
# 1. INISIALISASI GROQ
# ========================================================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

try:
    if not GROQ_API_KEY:
        raise ValueError("API Key Groq tidak ditemukan!")
    
    # Inisialisasi client Groq
    groq_client = Groq(api_key=GROQ_API_KEY)
    print("🚀 Groq AI siap melesat untuk LUMEN!")
except Exception as e:
    print(f"⚠️ Gagal koneksi ke Groq. Error: {e}")
    groq_client = None

# ========================================================
# 2. ENDPOINT SEMANTIC (SIMULASI)
# ========================================================
@app.route('/api/check-semantic', methods=['POST'])
def check_semantic():
    return jsonify({
        "similarity_score": 0.88, 
        "status": "Correct", 
        "feedback": "Koneksi Backend Aman!"
    })

# ========================================================
# 3. ENDPOINT CHATBOT HYBRID (GROQ -> FALLBACK RULE-BASED)
# ========================================================
@app.route('/api/chat', methods=['POST'])
def chat_assistant():
    data = request.json
    user_message = data.get('message', '').lower()

    if not user_message:
        return jsonify({"error": "Pesan kosong"}), 400

    # --------------------------------------------------------
    # RENCANA A: GUNAKAN GROQ (MODEL LLAMA 3)
    # --------------------------------------------------------
    if groq_client:
        try:
            # Menggunakan model Llama-3.3-70b-versatile
            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "Kamu adalah LUMEN-bot, asisten belajar bahasa Inggris. Jawab singkat, ramah, dan informatif."
                    },
                    {
                        "role": "user",
                        "content": user_message,
                    }
                ],
                model="llama-3.3-70b-versatile",
            )
            return jsonify({"reply": chat_completion.choices[0].message.content})
        
        except Exception as e:
            print(f"⚠️ Groq Error: {e}")
            print("🔄 Beralih ke Mode Rule-Based...")

    # --------------------------------------------------------
    # RENCANA B: FALLBACK RULE-BASED (JIKA API ERROR)
    # --------------------------------------------------------
    reply = "Maaf, sistem AI sedang sibuk. Tapi aku masih bisa membantu sapaan dasar!"
    if any(word in user_message for word in ['halo', 'hi', 'hello']):
        reply = "Halo! Aku LUMEN-bot (Mode Offline). Ada yang bisa dibantu?"
    elif 'grammar' in user_message:
        reply = "Grammar adalah pondasi bahasa. Ada topik spesifik yang ingin ditanyakan?"

    return jsonify({"reply": reply})

if __name__ == '__main__':
    app.run(debug=True, port=5001)