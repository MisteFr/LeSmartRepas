from PIL import Image
import base64
from mistralai import Mistral
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import json

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

# Function to decode base64 image data into a PIL Image
def decode_image_base64(image_base64):
    image_data = base64.b64decode(image_base64)
    buffer = BytesIO(image_data)
    image = Image.open(buffer)
    return image

# Function to encode image in base64 (for sending image data to API)
def encode_image_base64(image):
    buffer = BytesIO()
    image.save(buffer, format="JPEG")
    image_bytes = buffer.getvalue()
    return base64.b64encode(image_bytes).decode('utf-8')

# Function to call Mistral API for image analysis
def analyze_image_with_pixtral(image, client, model):
    # Convert the image to base64 string
    image_base64 = encode_image_base64(image)
    
    # Prepare the request payload
    chat_response = client.chat.complete(
        model=model,
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Please analyze this image of the inside of a fridge. I would like a detailed list "
                            "of all identifiable ingredients, including food items, condiments, and beverages, as well as "
                            "an approximate quantity for each. For example, if there is a bottle of milk, specify whether it's "
                            "full, half-full, or nearly empty. Be as specific as possible about the types of ingredients "
                            "(e.g., cheddar cheese vs. generic cheese, green peppers vs. red peppers) and give approximate quantities "
                            "where possible (e.g., '2 apples,' '1 half-full bottle of orange juice,' etc.). Answer with a json format following the following style"
                            """{
  "ingredients": [
    {
      "item": "Tomatoes",
      "quantity": "Approximately 6 tomatoes"
    },
    {
      "item": "Bell Peppers",
      "quantity": "Includes at least 1 red bell pepper and 1 yellow bell pepper"
    },"""
                        )
                    },
                    {
                        "type": "image_url",
                        "image_url": f"data:image/jpeg;base64,{image_base64}"
                    }
                ]
            },
        ]
    )
    
    # Get the response content
    return chat_response.choices[0].message.content

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
    ingredients = analyze_image_with_pixtral(image, client, model)
    
    # Save the ingredients as JSON locally
    ingredientsJson = save_ingredients_as_json(ingredients, file_name="ingredients.json")
    
    # Emit the ingredients list back to the client
    emit('response', {'ingredients': ingredientsJson})

# Example usage to run the Flask app
if __name__ == "__main__":
    socketio.run(app, debug=True, port=5001)
