# AI Service

## Setup Instructions

### 1. Navigate to project directory

cd ai-service

### 2. Create virtual environment

python -m venv env

> Note: For machine learning compatibility, use Python 3.11 or below.

### 3. Activate virtual environment

**Windows:**
call env\Scripts\activate

**Mac/Linux:**
source env/bin/activate

### 4. Install dependencies

pip install -r requirements.txt

### 5. Setup environment variables

Create a `.env` file in this directory and add:
GEMINI_API_KEY=your_api_key_here

### 6. Run the server

python app.py

Server will run at:
http://127.0.0.1:5001
