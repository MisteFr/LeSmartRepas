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

    handle_get_shopping(None)

    # Emit the ingredients list back to the client
    emit("response", {"ingredients": ingredientsJson, "calories": calories})

def generate_meals():
    ingredientsJson = get_data()
    user_data = get_data("user_data.json")

    model = "mistral-large-latest"
    client = Mistral(api_key=api_key)
    recipes = get_possible_recipes(ingredientsJson, client, model, user_data)
    
    print(recipes)
    
    cleaned_data = recipes.strip().split("```json")[1].split("```")[0]

    # Parse the cleaned string as JSON
    try:
        recipes_data = json.loads(cleaned_data)
        emit("response", {"recipes": recipes_data})

    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")

@socketio.on("get_shopping")
def handle_get_shopping(data):
    ingredientsJson = get_data()
    user_data = get_data("user_data.json")

    model = "mistral-large-latest"
    client = Mistral(api_key=api_key)
    shopping = get_shopping(ingredientsJson, client, model, user_data)

    print(shopping)
    emit("response", {"shopping": shopping})

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

