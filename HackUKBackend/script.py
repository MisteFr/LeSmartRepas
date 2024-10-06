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


last_generate_meals_call = 0
last_get_shopping_call = 0

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

api_key = (
        "D8aO43UD7KPqIHnZiKjqJIJYGcBk4zdp"  # Replace with your actual Mistral API key
    )


@socketio.on("submit_image")
def handle_image_submission(data):
    print("Received image data via WebSocket")

    # Extract base64 image data from the request
    image_base64 = data.get(
        "image"
    )  # Get the base64 image data from the WebSocket message

    if not image_base64:
        emit("response", {"error": "No image data provided"})
        return

    # Decode the base64 image into a PIL Image
    image = decode_image_base64(image_base64)

    # Initialize Mistral API client
    
    model = "pixtral-12b-2409"
    client = Mistral(api_key=api_key)

    # Analyze the image and get the ingredients list
    update_ingredients(image, client, model)

    # Save the ingredients as JSON locally
    ingredientsJson = get_data()
    calories = count_calories(client, model, "ingredients.json")
    
    # Emit the ingredients list back to the client
    emit("response", {"ingredients": ingredientsJson, "calories": calories})
    
    generate_meals()

def generate_meals():
    global last_generate_meals_call
    
    current_time = time.time()
    # Check if the function was called less than 2 seconds ago
    if current_time - last_generate_meals_call < 2:
        print("generate_meals called too recently. Skipping execution.")
        return
    
    print("Generating meals")
    # Update the last call timestamp
    last_generate_meals_call = current_time
    
    ingredientsJson = get_data()
    user_data = get_data("user_data.json")

    model = "mistral-large-latest"
    model = "mistral-large-latest"
    client = Mistral(api_key=api_key)
    recipes = get_possible_recipes(ingredientsJson, client, model, user_data)
    
    # if recipes doesn't contain json, we just want the emit the whole message
    # it means something went wrong
    # Check if the response contains JSON. If not, emit the raw message.
    if "```json" not in recipes:
        print("No JSON found in response. Emitting full message.")
        emit("response", {"messageRecipes": recipes})
        return
    
    cleaned_data = recipes.strip().split("```json")[1].split("```")[0]

    # Parse the cleaned string as JSON
    try:
        recipes_data = json.loads(cleaned_data)
        emit("response", {"recipes": recipes_data})

    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")

@socketio.on("get_shopping")
def handle_get_shopping():
    global last_get_shopping_call
    
    current_time = time.time()
    # Check if the function was called less than 2 seconds ago
    if current_time - last_get_shopping_call < 2:
        print("get_shopping called too recently. Skipping execution.")
        return
    
    print("get_shopping")
    last_get_shopping_call = current_time
    
    
    ingredientsJson = get_data()
    user_data = get_data("user_data.json")

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
def handle_request_recipes():
    generate_meals()

@socketio.on("save_ingredients")
def handle_save_ingredients(data):
    try:
        ingredients_data = json.loads(data)

        with open("ingredients.json", "w") as json_file:
            json.dump(ingredients_data, json_file, indent=4)
            print(f"Ingredients saved to ingredients.json")
            
        generate_meals()

    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
    

@socketio.on("submit_user_data")
def handle_submit_user_data(data):    
    try:
        user_data = data

        with open("user_data.json", "w") as json_file:
            json.dump(user_data, json_file, indent=4)
            print(f"pref saved to user_data.json")
            
        generate_meals()

    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
    

# Example usage to run the Flask app
if __name__ == "__main__":
    socketio.run(app, debug=True, port=5001)

