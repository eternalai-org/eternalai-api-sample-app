import base64
import os
import json

UPLOAD_DIR = "uploads"
CHARACTERS_FILE = "characters.json"

os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_image_file(file):
    # Get the original file extension (.png, .jpg, .jpeg)
    ext = os.path.splitext(file.filename)[1].lower()

    # Set a fixed filename as "1" + original extension
    new_filename = f"1{ext}"

    # Create the full file path
    path = os.path.join(UPLOAD_DIR, new_filename)

    # Save the file in the directory
    with open(path, "wb") as f:
        f.write(file.file.read())

    return path


def encode_image_base64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def image_to_base64_to_front_end(image_path):
    try:
        ext = os.path.splitext(image_path)[1].lower()  # get file extension (.png, .jpg, .jpeg)
        mime_type = "image/png"  # default
        if ext in [".jpg", ".jpeg"]:
            mime_type = "image/jpeg"

        with open(image_path, "rb") as image_file:
            image_base64 = base64.b64encode(image_file.read()).decode("utf-8")
            image_data = f"data:{mime_type};base64,{image_base64}"
    except FileNotFoundError:
        image_data = None

    return image_data


# ===============================================
# 🔹 Utility: Load & Save character list
# ===============================================

def load_characters():
    if not os.path.exists(CHARACTERS_FILE):
        with open(CHARACTERS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, ensure_ascii=False, indent=2)
    with open(CHARACTERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_characters(characters):
    with open(CHARACTERS_FILE, "w", encoding="utf-8") as f:
        json.dump(characters, f, ensure_ascii=False, indent=2)
