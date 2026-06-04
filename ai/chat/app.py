import json
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from groq import Groq

load_dotenv()

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

try:
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not found in environment")
    groq_client = Groq(api_key=GROQ_API_KEY)
    print("Groq client ready for LUMEN chat.")
except Exception as e:
    print(f"Warning: Groq connection failed — {e}")
    groq_client = None


@app.route("/api/check-semantic", methods=["POST"])
def check_semantic():
    return jsonify({
        "similarity_score": 0.88,
        "status": "Correct",
        "feedback": "Backend connection OK.",
    })


@app.route("/api/chat", methods=["POST"])
def chat_assistant():
    data = request.json or {}
    user_message = data.get("message", "").lower()
    bot_language = data.get("language", "id")

    if not user_message:
        return jsonify({"error": "Message cannot be empty."}), 400

    if groq_client:
        try:
            if bot_language == "en":
                system_instruction = (
                    "You are LUMEN-bot, a Native English Tutor. "
                    "You MUST reply STRICTLY in English. Be friendly, helpful, and concise."
                )
            else:
                system_instruction = (
                    "You are LUMEN-bot, an English learning assistant. "
                    "Reply briefly and warmly in Indonesian or mixed Indonesian/English."
                )

            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_message},
                ],
                model="llama-3.3-70b-versatile",
            )
            return jsonify({"reply": chat_completion.choices[0].message.content})

        except Exception as e:
            print(f"Warning: Groq chat error — {e}")

    reply = (
        "Sorry, the AI system is currently busy."
        if bot_language == "en"
        else "Maaf, sistem AI sedang sibuk."
    )
    return jsonify({"reply": reply})


@app.route("/api/ai/correct", methods=["POST"])
def ai_correct():
    data = request.json or {}
    text = data.get("text", "")

    if not text:
        return jsonify({"error": "Text cannot be empty."}), 400

    if groq_client:
        try:
            system_instruction = (
                "You are an English Grammar Correction expert. Analyze the user's input. "
                "Provide the fully corrected sentence in the 'corrected' field. "
                "In the 'matches' field, provide an array of objects detailing the errors. Each object must contain: "
                "'message' (explanation of error), 'replacements' (array of suggestions), 'offset' (character start index), "
                "and 'length' (length of wrong word). Return the response strictly as a JSON object, no markdown."
            )

            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": text},
                ],
                model="llama-3.3-70b-versatile",
                response_format={"type": "json_object"},
            )

            result = json.loads(chat_completion.choices[0].message.content)
            return jsonify(result)

        except Exception as e:
            print(f"Warning: Groq grammar correction error — {e}")
            return jsonify({"error": "AI processing failed.", "details": str(e)}), 500

    return jsonify({"corrected": text, "matches": []})


if __name__ == "__main__":
    app.run(debug=True, port=5001)
