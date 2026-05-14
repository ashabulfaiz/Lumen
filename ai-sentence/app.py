from flask import Flask, request, jsonify
from flask_cors import CORS
from grammar_model import grammar_pipeline

app = Flask(__name__)
CORS(app)

@app.route("/check-grammar", methods=["POST"])
def check_grammar():
    data = request.get_json()
    sentence = data.get("sentence", "")
    result = grammar_pipeline(sentence)
    return jsonify(result)

@app.route("/")
def home():
    return {
        "message": "Grammar API Running"
    }

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5002,
        debug=True
    )
