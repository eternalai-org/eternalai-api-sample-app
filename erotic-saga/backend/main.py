from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from utils.ai_api import call_ai_edit_image, generate_questions
from utils.file_manager import save_image_file, encode_image_base64, image_to_base64_to_front_end, load_characters, save_characters, UPLOAD_DIR
from utils.question_loader import load_questions_for_character
from typing import List
import base64
import os
import requests


app = FastAPI(title="AI Millionaire Game")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)       

# Memory stores
GENERATED_IMAGES = []
CURRENT_QUESTION = 0


# ==================== ADMIN PASSWORD AUTHENTICATION API ====================
@app.post("/api/verify-password")
async def verify_password(password: str = Form(...)):
    """
    Verify the admin password using the file password_admin.txt
    """
    file_path = "password_admin.txt"
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            correct_password = f.read().strip()
    except FileNotFoundError:
        return {"valid": False, "message": "⚠️ File password_admin.txt not found!"}

    if password.strip() == correct_password:
        return {"valid": True, "message": "✅ Authentication successful!"}
    else:
        return {"valid": False, "message": "❌ Incorrect password!"}


# ===============================================
# 🔹 API: Get prompt suggestions
# ===============================================
@app.get("/api/prompts")
async def get_prompts():
    """
    Return list of prompt suggestions from prompts.json
    """
    import json
    prompts_file = "prompts.json"
    try:
        with open(prompts_file, "r", encoding="utf-8") as f:
            prompts = json.load(f)
        return {"prompts": prompts}
    except FileNotFoundError:
        return {"prompts": []}
    except Exception as e:
        print(f"❌ Error reading prompts.json: {e}")
        return {"prompts": []}


# ===============================================
# 🔹 API: Get default background image (base64 data URL)
# ===============================================
@app.get("/api/default-background")
async def get_default_background():
    """
    Return default background image as data URL for frontend usage.
    """
    bg_path = "default_background.jpg"
    try:
        image_data = image_to_base64_to_front_end(bg_path)
        return {"image": image_data}
    except Exception as e:
        print(f"❌ Error reading default background: {e}")
        return {"image": None}


# ===============================================
# 🔹 API 1: Get all characters
# ===============================================

@app.get("/api/characters")
async def get_characters():
    """
    Return a list of all characters (id, name, original_image, folder)
    """
    characters = load_characters()
    for char in characters:
        img_path = char.get("original_image")
        if img_path:
            char["image"] = image_to_base64_to_front_end(img_path)

    return characters


# =====================================================
# 🧠 API: Upload + Generate images + Save character
# =====================================================
@app.post("/api/upload")
async def upload(
    name: str = Form(...),
    api_key: str = Form(...),
    prompts: List[str] = Form(...),
    image: UploadFile = None,
    questions_json: str = Form(None)
):
    """
    Receive character information (name, base image, prompts, api_key, questions)
    → Save the new character and generate corresponding images using AI
    """
    # Ensure the uploads directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # === Determine the new character ID ===
    characters = load_characters()
    new_id = len(characters) + 1
    existing_ids = {c.get("id", 0) for c in characters}
    while new_id in existing_ids:
        new_id += 1


    # === Normalize folder name: "id_name" ===
    safe_name = name.replace(" ", "_").lower()
    folder_name = f"{new_id}_{safe_name}"
    character_folder = os.path.join(UPLOAD_DIR, folder_name)
    os.makedirs(character_folder, exist_ok=True)

    # Save the original character image in a separate folder
    image_ext = os.path.splitext(image.filename)[1] or ".png"
    image_path = os.path.join(character_folder, f"0{image_ext}")
    original_image =image_path

    with open(image_path, "wb") as f:
        f.write(await image.read())

    print(api_key)
    # Generate images through the AI API
    for idx, prompt in enumerate(prompts, start=1):
        print(f"🎨 Processing prompt {idx}/{len(prompts)}: {prompt[:60]}...")

        result_url = call_ai_edit_image(api_key, image_path, prompt)

        if not result_url:
            print(f"⚠️ Prompt {idx} failed, skipping.")
            continue

        try:
            # Send request to download the result image
            res = requests.get(result_url, timeout=60)
            res.raise_for_status()

            # Rename the file sequentially: 1.jpg, 2.jpg, ...
            new_filename = f"{idx}{image_ext}"
            new_path = os.path.join(character_folder, new_filename)

            with open(new_path, "wb") as out_file:
                out_file.write(res.content)

            print(f"✅ Image {idx} saved at: {new_path}")

            # Update image_path to use the latest image next time
            image_path = new_path

        except Exception as e:
            print(f"❌ Error downloading image {idx}: {e}")
            continue

    
    # Save questions JSON if provided
    if questions_json:
        try:
            import json
            questions = json.loads(questions_json)
            # edit id to increase from 1
            for idx, q in enumerate(questions, start=1):
                q['id'] = idx
            questions_path = os.path.join(character_folder, "questions.json")
            with open(questions_path, "w", encoding="utf-8") as f:
                json.dump(questions, f, ensure_ascii=False, indent=2)
            print(f"✅ Questions saved to {questions_path}")
        except Exception as e:
            print(f"⚠️ Error saving questions: {e}")

    # Update character information in JSON file
    characters = load_characters()
    new_character = {
        "id": new_id,
        "name": name,
        "original_image": original_image,
        "folder": character_folder
    }
    characters.append(new_character)
    save_characters(characters)

    return {
        "message": f"✅ Character '{name}' has been added and images generated successfully!",
        "character": new_character,
        "images": GENERATED_IMAGES
    }


# =====================================================
# 🧠 API: Generate questions using AI
# =====================================================
@app.post("/api/generate-questions")
async def generate_questions_api(
    api_key: str = Form(...),
    topic: str = Form(...),
    difficulties: List[int] = Form(...),
    num_questions: int = Form(...)
):
    """
    Generate quiz questions using AI API based on topic and difficulty levels.
    """
    try:
        # Convert difficulties from FormData (strings) to integers
        difficulties_int = [int(d) for d in difficulties]
        
        questions = generate_questions(
            api_key=api_key,
            topic=topic,
            difficulties=difficulties_int,
            num_questions=num_questions
        )
        
        if questions:
            return {
                "success": True,
                "questions": questions,
                "count": len(questions)
            }
        else:
            return {
                "success": False,
                "message": "Failed to generate questions. Please try again."
            }
    except Exception as e:
        print(f"❌ Error generating questions: {e}")
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }


@app.post("/api/question/{qid}")
async def get_question(qid: int, character_id: int = Form(...)):
    """
    Return the question and corresponding image
    """
    # Find character by ID
    characters = load_characters()
    char = next((c for c in characters if c["id"] == character_id), None)
    if not char:
        return {"error": "❌ Character not found!"}

    # Path to the folder containing image files
    folder_path = char["folder"]

    # Load questions for this character
    try:
        questions = load_questions_for_character(folder_path)
    except FileNotFoundError as e:
        return {"error": str(e)}

    if qid > len(questions):
        return {"done": True, "message": "🎉 You have completed the game!"}

    question = questions[qid - 1]


    # Get list of files image
    image_extensions = (".jpg", ".jpeg", ".png", ".gif", ".webp")
    files = [
        f for f in os.listdir(folder_path)
        if os.path.isfile(os.path.join(folder_path, f))
        and f.lower().endswith(image_extensions)
    ]

    # Sort alphabetically
    files.sort()

    image = files[qid - 1] if qid - 1 < len(files) else ""
    image_path = os.path.join(folder_path, image)
    image_data = image_to_base64_to_front_end(image_path)
    
    return {"question": question, "image": image_data, "character_name": char["name"]}


@app.post("/api/answer")
async def submit_answer(question_id: int = Form(...), answer: str = Form(...), character_id: int = Form(...)):
    """
    Check the answer. If correct → unlock the next image.
    If the player wins → return the final image.
    """

    # Folder containing images
    # Find character
    characters = load_characters()
    char = next((c for c in characters if c["id"] == character_id), None)
    if not char:
        return {"correct": False, "message": "❌ Character not found!"}

    folder_path = char["folder"]

    # Load questions for the character
    try:
        questions = load_questions_for_character(folder_path)
    except FileNotFoundError as e:
        return {"correct": False, "message": str(e)}

    question = questions[question_id - 1]
    correct = (answer.strip().lower() == question["answer"].strip().lower())

    if not correct:
        return {"correct": False, "message": "❌ Wrong answer! Game Over."}

    next_id = question_id + 1

    

    # Get list of files image
    image_extensions = (".jpg", ".jpeg", ".png", ".gif", ".webp")
    files = [
        f for f in os.listdir(folder_path)
        if os.path.isfile(os.path.join(folder_path, f))
        and f.lower().endswith(image_extensions)
    ]
    files.sort()

    # If the player wins (no more questions)
    if next_id > len(questions) or next_id > len(files)-1:
        last_img = files[-1] if len(files) > 0 else None
        image_data = None
        if last_img:
            img_path = os.path.join(folder_path, last_img)
            ext = os.path.splitext(img_path)[1].lower()
            mime_type = "image/png" if ext not in [".jpg", ".jpeg"] else "image/jpeg"
            with open(img_path, "rb") as image_file:
                b64 = base64.b64encode(image_file.read()).decode("utf-8")
                image_data = f"data:{mime_type};base64,{b64}"

        return {
            "correct": True,
            "message": "🎉 Congratulations! You won!",
            "next_question": None,
            "next_image": image_data,
        }

    # If there are still more questions
    next_q = questions[next_id - 1]
    next_img = files[next_id - 1] if next_id - 1 < len(files) else ""
    next_img_path = os.path.join(folder_path, next_img)

    image_data = image_to_base64_to_front_end(next_img_path)

    return {
        "correct": True,
        "next_question": next_q,
        "next_image": image_data,
    }