from PIL import Image
import base64
from mistralai import Mistral
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import json
from utils import count_calories, decode_image_base64, encode_image_base64, save_ingredients_as_json, get_data
from inventory import update_ingredients
import json
from recipes import get_possible_recipes
from shopping import get_shopping
import time
import os


last_generate_meals_call = 0
last_get_shopping_call = 0

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

api_key = os.getenv("MISTRAL_API_KEY")
if not api_key:
    raise ValueError("Mistral API key is not set. Please set it in the environment.")


@socketio.on("submit_image")
def handle_image_submission(data):
    print("Received image data via WebSocket")

    # Extract base64 image data from the request
    image_base64 = data.get(
        "image"
    )  # Get the base64 image data from the WebSocket message
    
    preferences = data.get(
        "pref"
    )
    
    print(data.get(("pref")))

    if not image_base64:
        emit("response", {"error": "No image data provided"})
        return
    
    if not preferences:
        emit("response", {"error": "No preferences provided"})
        return

    # Decode the base64 image into a PIL Image
    image = decode_image_base64(image_base64)

    # Initialize Mistral API client
    
    model = "pixtral-12b-2409"
    client = Mistral(api_key=api_key)

    # Analyze the image and get the ingredients list
    ingredients_list = update_ingredients(image, client, model)
    
    cleaned_data = ingredients_list.strip().strip("```json").strip("```").strip()

    # Parse the cleaned string as JSON
    try:
        ingredientsJson = json.loads(cleaned_data)
        
        # Emit the ingredients list back to the client
        emit("response", {"ingredients": ingredientsJson})
        
        generate_meals(ingredientsJson, preferences)
        
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return None

def generate_meals(ingredientsAsJson, userPreferences):
    global last_generate_meals_call
    
    current_time = time.time()
    # Check if the function was called less than 2 seconds ago
    if current_time - last_generate_meals_call < 2:
        print("generate_meals called too recently. Skipping execution.")
        return
    
    print("Generating meals")
    # Update the last call timestamp
    last_generate_meals_call = current_time
    
    ingredientsJson = ingredientsAsJson
    user_data = userPreferences

    model = "mistral-large-latest"
    client = Mistral(api_key=api_key)
    recipes = get_possible_recipes(ingredientsJson, client, model, user_data)
    
    # if recipes doesn't contain json, we just want the emit the whole message
    # it means something went wrong
    # Check if the response contains JSON. If not, emit the raw message.
    if "```json" not in recipes:
        print("No JSON found in response. Emitting full message.")
        emit("response", {"messageRecipes": recipes})
        handle_get_shopping(ingredientsAsJson, userPreferences)
        return
    
    cleaned_data = recipes.strip().split("```json")[1].split("```")[0]

    # Parse the cleaned string as JSON
    try:
        recipes_data = json.loads(cleaned_data)
        emit("response", {"recipes": recipes_data})
        
        handle_get_shopping(ingredientsAsJson, userPreferences)

    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")

@socketio.on("get_shopping")
def handle_get_shopping(ingredientsAsJson, userPreferences):
    global last_get_shopping_call
    
    current_time = time.time()
    # Check if the function was called less than 2 seconds ago
    if current_time - last_get_shopping_call < 2:
        print("get_shopping called too recently. Skipping execution.")
        return
    
    print("get_shopping")
    last_get_shopping_call = current_time
    
    
    ingredientsJson = ingredientsAsJson
    user_data = userPreferences

    model = "mistral-large-latest"
    client = Mistral(api_key=api_key)
    shopping = get_shopping(ingredientsJson, client, model, user_data)
    
    cleaned_data = shopping.split("```json")[1].split("```")[0]

    # Parse the cleaned string as JSON
    try:
        shopping = json.loads(cleaned_data)
        emit("response", {"shopping": shopping})

    except json.JSONDecodeError as e:
        print(f"Error parsing JSON for shopping: {e}")
        
@socketio.on("request_recipes")
def handle_request_recipes(data):
    ingredients = data.get(
            "ingredients"
        ) 
        
    preferences = data.get(
        "pref"
    )

    if not ingredients:
        emit("response", {"error": "No ingredients data provided"})
        return
    
    if not preferences:
        emit("response", {"error": "No preferences provided"})
        return
        
    print(data.get(("pref")))
    
    try:
    
        ingredients_data = json.loads(data.get(("ingredients")))
        prefData = json.loads(data.get(("pref")))
        
            
        generate_meals(ingredients_data, prefData)
        
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")

    

# Example usage to run the Flask app
if __name__ == "__main__":
    socketio.run(app, debug=False, port=5001)

