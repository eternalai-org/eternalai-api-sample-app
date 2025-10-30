import os
import json

QUESTIONS_FILE = os.path.join(os.path.dirname(__file__), "..", "questions.json")

def load_questions_for_character(character_folder: str):
    """
    Load the questions.json file located inside a character's folder.
    """
    q_path = os.path.join(character_folder, "questions.json")
    if not os.path.exists(q_path):
        raise FileNotFoundError(f"⚠️ questions.json not found in {character_folder}")
    with open(q_path, "r", encoding="utf-8") as f:
        return json.load(f)
