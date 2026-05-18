from flask import Flask, request, jsonify
from flask_cors import CORS
from grammar_model import grammar_pipeline

app = Flask(__name__)
CORS(app)


@app.route("/check-grammar", methods=["POST"])
def check_grammar():
    data = request.get_json(silent=True) or {}
    sentence = data.get("sentence", "")
    mode = data.get("mode", "grade")
    if mode not in ("grade", "assist"):
        mode = "grade"
    result = grammar_pipeline(sentence, mode=mode)
    status_code = 200 if result.get("status") != "error" else 503
    return jsonify(result), status_code


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Grammar API running"})


@app.route("/")
def home():
    return {
        "message": "Grammar API Running",
        "endpoints": {
            "POST /check-grammar": {
                "sentence": "string",
                "mode": "grade | assist",
            }
        },
    }


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)
