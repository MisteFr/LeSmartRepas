from PIL import Image
import base64
from mistralai import Mistral
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import json


# Function to decode base64 image data into a PIL Image
def decode_image_base64(image_base64):
    image_data = base64.b64decode(image_base64)
    buffer = BytesIO(image_data)
    image = Image.open(buffer)
    return image


# Function to encode image in base64 (for sending image data to API)
def encode_image_base64(image):
    buffer = BytesIO()
    # If the image is in "P" mode, convert it to "RGB"
    if image.mode == "P":
        image = image.convert("RGB")

    image.save(buffer, format="JPEG")
    image_bytes = buffer.getvalue()
    return base64.b64encode(image_bytes).decode("utf-8")


# Function to save the ingredients list as JSON locally
def save_ingredients_as_json(ingredients_list, file_name="ingredients.json"):
    cleaned_data = ingredients_list.strip().strip("```json").strip("```").strip()

    # Parse the cleaned string as JSON
    try:
        ingredients_data = json.loads(cleaned_data)

        with open(file_name, "w") as json_file:
            json.dump(ingredients_data, json_file, indent=4)
            print(f"Ingredients saved to {file_name}")
            return ingredients_data

    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return None


# Function to call Mistral API for image analysis
def count_calories(client, model, ingredients_file_path: str):
    # Load the JSON file
    with open("./ingredients.json", "r") as file:
        ingredients_data = json.load(file)

    # Convert the ingredients data to a formatted string
    ingredients_str = json.dumps(ingredients_data, indent=2)

    # Prepare the request payload
    chat_response = client.chat.complete(
        model=model,
        messages=[
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Please analyze this list of foods below."
                            "Guess the total number calories in the food. ONLY RESPOND WITH AN INTEGER VALUE. If you aren't sure, respond with 0."
                            "Example Response: 2000"
                            f"\n\n{ingredients_str}\n\n"
                        ),
                    }
                ],
            },
        ],
    )

    calorie_count = chat_response.choices[0].message.content

    return calorie_count
