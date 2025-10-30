# backend - Erotic Saga Game

## 📁 Directory Structure

```
backend/
├── main.py                 # FastAPI application - all API endpoints
├── requirements.txt        # Python dependencies
├── characters.json         # Characters list
├── prompts.json            # Prompt suggestions list
├── password_admin.txt      # Admin password
├── default_background.jpg  # Default background image
│
├── utils/                  # Utility functions
│   ├── ai_api.py           # Eternal AI API integration
│   ├── file_manager.py     # File utilities & base64 encoding
│   └── question_loader.py  # Load questions from JSON
│
└── uploads/                # Character folders and images
    ├── {id}_{name}/
    │   ├── 0.jpg           # Original image
    │   ├── 1.jpg           # AI-generated images
    │   └── questions.json  # Questions for the character
```

## 🚀 Run the App

### Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Start Server

#### Development Mode (with auto-reload)

```bash
cd backend
uvicorn main:app --reload
```

Server runs at: `http://127.0.0.1:8000`

**Note:** In development mode, the frontend should be run separately using `npm run dev` in the `frontend` directory. The frontend will proxy API requests to the backend.

## 📋 API Endpoints

- `POST /api/verify-password` - Verify admin password
- `GET /api/prompts` - Get prompt suggestions
- `GET /api/default-background` - Get default background image
- `GET /api/characters` - Get characters list
- `POST /api/upload` - Upload a new character
- `POST /api/generate-questions` - Generate questions via AI
- `POST /api/question/{qid}` - Get question by ID
- `POST /api/answer` - Submit and validate an answer

## 📝 Notes

- All endpoints are defined in `main.py`
- Utility functions live in `utils/`
- Data is stored as JSON files
- `uploads/` contains all character images and questions
