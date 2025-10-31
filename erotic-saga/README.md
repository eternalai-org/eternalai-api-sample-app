# Erotic Saga - AI Millionaire Quiz Game

An interactive quiz game with the ability to create characters and AI‑generated images.

Live Review [Erotic Saga](https://margot-nonflagellate-hitchily.ngrok-free.dev/)

## 📋 Project Overview

### Tech Stack

- **backend**: FastAPI (Python)
- **Frontend**: React + Vite
- **AI Service**: Eternal AI API (uncensored-reimagine)
- **Deployment**: Docker

### Core Features

1. **Admin Mode**: Create new characters with AI-generated image variations
2. **Game Mode**: Answer questions to unlock images step by step
3. **Authentication**: Password-protected admin access

## 🚀 How to Run

### 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.8+ ([Download](https://www.python.org/downloads/))
- **Git** (optional, for cloning)

---

## 🚀 Development Mode (Recommended)

Run backend and frontend separately for development.

### Step 1: Setup backend

```bash
cd backend

# (Optional) Create virtual environment
python -m venv .venv

# Activate virtual environment (Linux/macOS)
source .venv/bin/activate

# If on Windows (PowerShell):
# .venv\\Scripts\\Activate.ps1

pip install -r requirements.txt

```

### Step 2: Start backend Server

```bash
cd backend
uvicorn main:app --reload
```

backend will run at: `http://127.0.0.1:8000`

### Step 3: Setup Frontend

```bash
cd frontend
npm install
```

### Step 4: Start Frontend Dev Server

```bash
cd frontend
npm run dev
```

Frontend will run at: `http://localhost:5173`

✅ **Open browser:** `http://localhost:5173`

⚠️ **Note:** Vite proxy is preconfigured to forward API requests from frontend to backend (`/api` → `http://127.0.0.1:8000`).

---

## 📁 Project Structure

```
Game/
├── backend/                    # FastAPI backend
│   ├── main.py                 # Main API endpoints
│   ├── requirements.txt        # Python dependencies
│   ├── characters.json         # Characters list
│   ├── password_admin.txt      # Admin password (current: 123)
│   ├── prompts.json            # Prompt suggestions for images
│   ├── uploads/                # Uploaded images and questions
│   │   ├── {id}_{name}/        # Folder per character
│   │   │   ├── 0.jpg           # Original image
│   │   │   ├── 1.jpg           # AI-generated image 1
│   │   │   ├── 2.jpg           # AI-generated image 2
│   │   │   └── questions.json  # Character-specific questions
│   └── utils/
│       ├── ai_api.py           # Eternal AI API integration
│       ├── file_manager.py     # File and base64 helpers
│       └── question_loader.py  # Load questions from JSON
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── App.jsx             # Routing
│   │   ├── pages/
│   │   │   ├── HomePage.jsx    # Home - choose character
│   │   │   ├── UploadPage.jsx  # Admin - create character
│   │   │   └── GamePage.jsx    # Game page
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js          # Vite + proxy
```

---

## 🎯 API Endpoints

### 1. Admin Verification

```
POST /api/verify-password
Body: FormData { password: "123" }
Response: { valid: true/false, message: "..." }
```

### 2. Get Characters

```
GET /api/characters
Response: [{ id, name, image (base64), folder }]
```

### 3. Upload Character (Admin)

```
POST /api/upload
Body: FormData {
  name: "character_name",
  api_key: "eternal_ai_key",
  prompts: ["prompt1", "prompt2", ...],
  image: File,
  questions_json?: string // optional questions JSON
}
Response: { message, character, images }
```

### 4. Get Question

```
POST /api/question/{qid}
Body: FormData { character_id: 1 }
Response: { question: {...}, image: "base64", character_name: "..." }
```

### 5. Submit Answer

```
POST /api/answer
Body: FormData {
  question_id: 1,
  answer: "Paris",
  character_id: 1
}
Response: {
  correct: true/false,
  next_question: {...},
  next_image: "base64"
}
```

---

## 📝 How to Use

### 🔐 Admin Mode (Add Character)

1. On Home → Click "➕ Add New Character"
2. Enter password: `123` (from `backend/password_admin.txt`)
3. Fill in:
   - **API Key**: Eternal AI API key
   - **Character Name**
   - **Character Image**: Upload base image
   - **Prompts**: Prompts for AI editing
4. Click "Submit" → backend will:
   - Save original image
   - Call Eternal AI API to generate images per prompt
   - Save images into `uploads/{id}_{name}/`
   - Update `characters.json`

### 🎮 Game Mode (Play)

1. On Home → Click "🎯 Start Game"
2. Choose a character
3. Answer questions to unlock the next image
4. Finish all to reveal the final image ✨

---

## ⚙️ Configuration

### backend (`backend/`)

- **Port**: 8000
- **CORS**: Allow all origins
- **Data Storage**:
  - `characters.json`: Characters list
  - `uploads/`: Image storage
  - `password_admin.txt`: Admin password

### Frontend (`frontend/`)

- **Dev Port**: 5173
- **Proxy**: `/api` → `http://127.0.0.1:8000`
- **Routing**: React Router

### Eternal AI Integration

- **URL**: `https://agentic.eternalai.org/prompt`
- **Agent**: `uncensored-reimagine`
- **Timeout**: up to 5 minutes per request
- Requires a valid API key

---

## 🔧 Troubleshooting

### backend doesn't start

```bash
# Check Python version (3.8+)
python --version

# Reinstall dependencies
cd backend
pip install -r requirements.txt
```

### Frontend can't reach API

```bash
# Ensure backend is running on port 8000 first
# Terminal 1: cd backend && uvicorn main:app --reload

# Then start frontend in another terminal
# Terminal 2: cd frontend && npm run dev

# Check proxy in vite.config.js (should forward /api to http://127.0.0.1:8000)
```

### AI doesn't generate images

- Verify your API key
- Check your internet connection
- See terminal logs for details

### Data safety

- Backup `backend/characters.json`
- Backup `backend/uploads/`

---

## 📦 Dependencies

### backend (`requirements.txt`)

```
fastapi
uvicorn
requests
python-multipart
```

### Frontend (`package.json`)

```json
{
  "dependencies": {
    "axios": "^1.12.2",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^7.9.4"
  }
}
```

---

## 🔐 Security Notes

- `password_admin.txt` stores password in plain text (not suitable for production)
- CORS allows all origins (lock down in production)
- API key is sent from client (consider server-side calls or encryption in production)

---

Made with ❤️ using FastAPI + React + Eternal AI
