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
    
    # 1. TANGKAP PILIHAN BAHASA DARI REACT (Default: id)
    bot_language = data.get('language', 'id') 

    if not user_message:
        return jsonify({"error": "Pesan kosong"}), 400

    if groq_client:
        try:
            # 2. UBAH KEPRIBADIAN BOT SECARA DINAMIS
            if bot_language == 'en':
                system_instruction = "You are LUMEN-bot, a Native English Tutor. You MUST reply STRICTLY in English. Be friendly, helpful, and concise."
            else:
                system_instruction = "Kamu adalah LUMEN-bot, asisten belajar bahasa Inggris. Jawab singkat dan ramah menggunakan bahasa Indonesia atau campur."

            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_message}
                ],
                model="llama-3.3-70b-versatile",
            )
            return jsonify({"reply": chat_completion.choices[0].message.content})
        
        except Exception as e:
            print(f"⚠️ Groq Error: {e}")

    # Fallback Rule-based (sesuaikan juga bahasanya)
    reply = "Maaf, sistem AI sedang sibuk." if bot_language == 'id' else "Sorry, the AI system is currently busy."
    return jsonify({"reply": reply})

if __name__ == '__main__':
    app.run(debug=True, port=5001)