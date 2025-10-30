import requests
import json
import time
import os
import threading
import re


AI_API_URL = "https://agentic.eternalai.org/prompt"
RESULT_API_URL = "https://agent-api.eternalai.org/result"

from utils.file_manager import encode_image_base64


def call_ai_edit_image(api_key: str, image_path: str, prompt: str):
    """
    Send an image and a prompt to EternalAI for editing and return the resulting image URL.
    - api_key: a valid API key.
    - image_path: path to the image file (e.g., "uploads/sample.jpg")
    - prompt: text describing the edit instructions.
    """
    try:
        # 🧩 Get filename and MIME type from file
        filename = os.path.basename(image_path)
        ext = os.path.splitext(filename)[1].lower()

        if ext in [".jpg", ".jpeg"]:
            mime_type = "image/jpeg"
        elif ext == ".png":
            mime_type = "image/png"
        else:
            mime_type = "image/jpeg"  # default

        # 🔁 Encode image to base64 and add MIME prefix
        image_b64 = encode_image_base64(image_path)
        image_b64_full = f"data:{mime_type};base64,{image_b64}"

        headers = {
            "x-api-key": api_key,
            "accept": "application/json",
            "content-type": "application/json"
        }

        # ===== Step 1: Send image generation request =====
        payload = {
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_b64_full,
                                "filename": filename
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ],
            "agent": "uncensored-reimagine"
        }

        print(f"📤 Sending AI edit request for {filename}: {prompt[:60]}...")
        response = requests.post(AI_API_URL, headers=headers, json=payload)
        response.raise_for_status()

        data = response.json()
        request_id = data.get("request_id")
        if not request_id:
            print("❌ No request_id returned from API.")
            return None

        print(f"🆔 Request ID: {request_id}")

        # ===== Step 2: Poll result using while loop =====
        polling_url = f"{RESULT_API_URL}?agent=uncensored-reimagine&request_id={request_id}"
        last_progress = 0
        start_time = time.time()

        while True:
            time.sleep(1)
            result_res = requests.get(polling_url, headers=headers)
            result_res.raise_for_status()
            result_json = result_res.json()

            status = result_json.get("status")
            if isinstance(status, dict):
                status = status.get("status", "unknown")

            # Display progress if available
            log = result_json.get("log", "")
            if isinstance(log, str) and '"progress":' in log:
                try:
                    log_json = json.loads(log)
                    progress = log_json.get("progress", last_progress)
                    if progress != last_progress:
                        print(f"⏳ Progress: {progress}%")
                        last_progress = progress
                except json.JSONDecodeError:
                    pass

            if status == "success":
                result_url = (
                    result_json.get("cdn_url")
                    or result_json.get("result_url")
                    or result_json.get("result_image_url")
                )
                print(f"✅ Done! Result URL: {result_url}")
                return result_url

            elif status == "failed":
                print("❌ Generation failed:", result_json)
                return None

            # Timeout after 5 minutes to prevent infinite waiting
            if time.time() - start_time > 300:
                print("⚠️ Timeout: waited 5 minutes without success.")
                return None

    except requests.exceptions.RequestException as e:
        print("❌ Network error:", e)
        return None
    except Exception as e:
        print("❌ Unexpected error:", e)
        return None


def extractjson(content):
    """
    Extract JSON array from text content, handling markdown code blocks and formatting.
    """
    if not content:
        print("Error: No content received in the response.")
        return None

    print("\n📝 Extracting JSON from response...")

    # --- Step 1: Remove markdown code blocks (```json or ```) if present ---
    cleaned = re.sub(r"```(?:json)?", "", content)

    # --- Step 2: Find the first JSON array in the content ---
    match = re.search(r"\[\s*{[\s\S]*}\s*\]", cleaned)
    if not match:
        print("⚠️ Could not find JSON array in response.")
        return None

    json_str = match.group(0).strip()

    # --- Step 3: Parse JSON ---
    try:
        data = json.loads(json_str)
        print(f"✅ Extracted {len(data)} items successfully!")
        return data
    except json.JSONDecodeError as e:
        print(f"❌ JSON parse error: {e}")
        print(f"⚠️ JSON snippet: {json_str[:300]}")
        return None


def generate_questions(api_key: str, topic: str, difficulties: list[int], num_questions: int):
    """
    Generate quiz questions using AI based on topic and difficulty levels via streaming API.
    - api_key: AI API key
    - topic: Topic for the questions (e.g., "Science", "History", "General Knowledge")
    - difficulties: List of difficulty levels (1-10) for each question
    - num_questions: Number of questions to generate
    Returns a list of questions in JSON format.
    """
    try:
        # Create a prompt for the AI to generate questions
        prompt = f'''Create {num_questions} multiple-choice questions about the topic "{topic}".
Each question must have 4 options and 1 correct answer.
The difficulty levels of the questions are given in this list: {difficulties}.

Return the result in pure JSON format, following exactly this structure:
[
{{
"id": 1,
"question": "What is the capital of France?",
"options": ["Paris", "Ha Noi", "London", "Berlin"],
"answer": "Paris"
}},
{{
"id": 2,
"question": "Which animal says 'meow'?",
"options": ["Cat", "Bitch", "Dog", "Elephant"],
"answer": "Cat"
}}
]

Requirements:

The output must be valid JSON (no extra text or explanation).

Each question should match the corresponding difficulty level in the list.

All options should be plausible but only one correct.

Questions and answers must be in English.'''

        headers = {
            "accept": "text/event-stream",
            "x-api-key": api_key,
            "Content-Type": "application/json"
        }

        payload = {
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ],
            "agent": "uncensored-chat",
            "stream": True
        }

        print(f"📤 Generating {num_questions} questions about '{topic}'...")
        
        # Send POST request with streaming
        response = requests.post(AI_API_URL, headers=headers, json=payload, stream=True, timeout=300)
        response.raise_for_status()

        # Handle streaming response
        content = ""
        request_id = "unknown"
        print("Streaming response started...")
        
        try:
            for line in response.iter_lines():
                if line:
                    line = line.decode("utf-8")
                    if line.startswith("data:"):
                        try:
                            # Parse the SSE data field
                            data = json.loads(line[5:].strip())  # Remove "data:" prefix
                            
                            # Get request_id from first chunk if available
                            if request_id == "unknown" and "id" in data:
                                request_id = data.get("id", "unknown")
                                print(f"Request ID: {request_id}")
                            
                            # Extract content from choices
                            choices = data.get("choices", [])
                            for choice in choices:
                                delta = choice.get("delta", {})
                                chunk_content = delta.get("content", "")
                                if chunk_content:
                                    content += chunk_content
                                    print(chunk_content, end="", flush=True)
                                
                                # Check finish_reason to end streaming
                                finish_reason = choice.get("finish_reason")
                                if finish_reason:
                                    print(f"\nStream finished with reason: {finish_reason}")
                                    break
                        except json.JSONDecodeError:
                            continue  # Skip invalid JSON chunks
                    elif line == "data: [DONE]":  # SSE end signal
                        break
        except Exception as e:
            print(f"\nError processing streaming response: {e}")
            return None

        # Parse JSON from the complete content
        questions_json = extractjson(content)
        
        if questions_json:
            print(f"✅ Generated {len(questions_json)} questions successfully!")
        
        return questions_json

    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None
