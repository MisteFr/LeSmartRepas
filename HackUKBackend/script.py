import json
import os
import time
import asyncio
from websockets import serve
from mistralai import Mistral
from utils import count_calories, decode_image_base64, encode_image_base64, save_ingredients_as_json, get_data
from inventory import update_ingredients
from recipes import get_possible_recipes
from shopping import get_shopping
import websockets

last_generate_meals_call = 0
last_get_shopping_call = 0

# Ensure that your Mistral API key is set in the environment
api_key = os.getenv("MISTRAL_API_KEY")
if not api_key:
    raise ValueError("Mistral API key is not set. Please set it in the environment.")

# WebSocket handler
async def websocket_handler(websocket, path):
    while True:
        try:
            message = await websocket.recv()
            print(message)
            
            data = json.loads(message)
            event = data.get("event")
            dataEvent = data.get("data")

            if event == "submit_image":
                await handle_image_submission(dataEvent, websocket)
            elif event == "send_data":
                await handle_request_data(dataEvent, websocket)
        
        except websockets.exceptions.WebSocketException:
            print("Client disconnected")
            break
    

# Function to handle image submission and generate ingredients list
async def handle_image_submission(data, websocket):
    print("Received image data via WebSocket")

    image_base64 = data.get("image")
    preferences = data.get("pref")

    if not image_base64:
        await websocket.send(json.dumps({"error": "No image data provided"}))
        return

    if not preferences:
        await websocket.send(json.dumps({"error": "No preferences provided"}))
        return

    # Decode the base64 image
    image = decode_image_base64(image_base64)

    # Initialize Mistral API client
    model = "pixtral-12b-2409"
    client = Mistral(api_key=api_key)

    # Analyze the image and get the ingredients list
    ingredients_list = update_ingredients(image, client, model)
    cleaned_data = ingredients_list.strip().strip("```json").strip("```").strip()

    try:
        ingredients_json = json.loads(cleaned_data)
        await websocket.send(json.dumps({"ingredients": ingredients_json}))
        await generate_meals(ingredients_json, preferences, websocket)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        await websocket.send(json.dumps({"error": "Failed to parse ingredients data"}))

# Function to generate meals based on ingredients and user preferences
async def generate_meals(ingredients_json, user_preferences, websocket):
    global last_generate_meals_call

    current_time = time.time()
    if current_time - last_generate_meals_call < 2:
        print("generate_meals called too recently. Skipping execution.")
        return

    print("Generating meals")
    last_generate_meals_call = current_time

    model = "mistral-large-latest"
    client = Mistral(api_key=api_key)
    recipes = get_possible_recipes(ingredients_json, client, model, user_preferences)

    if "```json" not in recipes:
        print("No JSON found in response. Emitting full message.")
        await websocket.send(json.dumps({"messageRecipes": recipes}))
        await handle_get_shopping(ingredients_json, user_preferences, websocket)
        return

    cleaned_data = recipes.strip().split("```json")[1].split("```")[0]

    try:
        recipes_data = json.loads(cleaned_data)
        await websocket.send(json.dumps({"recipes": recipes_data}))
        await handle_get_shopping(ingredients_json, user_preferences, websocket)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        await websocket.send(json.dumps({"error": "Failed to parse recipes data"}))

# Function to fetch shopping list based on ingredients and user preferences
async def handle_get_shopping(ingredients_json, user_preferences, websocket):
    global last_get_shopping_call

    current_time = time.time()
    if current_time - last_get_shopping_call < 2:
        print("get_shopping called too recently. Skipping execution.")
        return

    print("Fetching shopping list")
    last_get_shopping_call = current_time

    model = "mistral-large-latest"
    client = Mistral(api_key=api_key)
    shopping = get_shopping(ingredients_json, client, model, user_preferences)

    cleaned_data = shopping.split("```json")[1].split("```")[0]

    try:
        shopping_data = json.loads(cleaned_data)
        await websocket.send(json.dumps({"shopping": shopping_data}))
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON for shopping: {e}")
        await websocket.send(json.dumps({"error": "Failed to parse shopping data"}))

# Function to handle recipe requests
async def handle_request_data(data, websocket):
    print("here")
    
    ingredients = data.get("ingredients")
    preferences = data.get("pref")

    if not ingredients:
        #await websocket.send(json.dumps({"error": "No ingredients data provided"}))
        return

    if not preferences:
        #await websocket.send(json.dumps({"error": "No preferences provided"}))
        return

    try:
        ingredients_data = json.loads(ingredients)
        preferences_data = json.loads(preferences)
        await generate_meals(ingredients_data, preferences_data, websocket)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        await websocket.send(json.dumps({"error": "Failed to parse request data"}))

async def start_server():
    async with serve(websocket_handler, "localhost", 5001):
        await asyncio.Future()

if __name__ == "__main__":
    # Run the WebSocket server
    asyncio.run(start_server())