from PIL import Image
import base64
from mistralai import Mistral
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import json
from utils import decode_image_base64, encode_image_base64
from inventory import get_ingredients, update_ingredients
from recipes import get_possible_recipes

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

@socketio.on('submit_image')
def handle_image_submission(data):
    print("Received image data via WebSocket")

    # Extract base64 image data from the request
    image_base64 = data.get('image')  # Get the base64 image data from the WebSocket message
    
    if not image_base64:
        emit('response', {'error': 'No image data provided'})
        return

    # Decode the base64 image into a PIL Image
    image = decode_image_base64(image_base64)

    # Initialize Mistral API client
    api_key = "D8aO43UD7KPqIHnZiKjqJIJYGcBk4zdp"  # Replace with your actual Mistral API key
    model = "pixtral-12b-2409"
    client = Mistral(api_key=api_key)
    
    # Analyze the image and get the ingredients list
    update_ingredients(image, client, model)
    
    # Save the ingredients as JSON locally
    ingredientsJson = get_ingredients()

    print(get_possible_recipes(ingredientsJson, client, model))
    
    # Emit the ingredients list back to the client
    emit('response', {'ingredients': ingredientsJson})

# Example usage to run the Flask app
if __name__ == "__main__":
    socketio.run(app, debug=True, port=5001)
