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
    return base64.b64encode(image_bytes).decode('utf-8')

# Function to save the ingredients list as JSON locally
def save_ingredients_as_json(ingredients_list, file_name="ingredients.json"):
    cleaned_data = ingredients_list.strip().strip('```json').strip('```').strip()
    
    # Parse the cleaned string as JSON
    try:
        ingredients_data = json.loads(cleaned_data)
        
        with open(file_name, 'w') as json_file:
            json.dump(ingredients_data, json_file, indent=4)
            print(f"Ingredients saved to {file_name}")
            return ingredients_data
            
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return None