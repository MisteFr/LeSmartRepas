from PIL import Image
import base64
from mistralai import Mistral
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import json

from utils import encode_image_base64

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
                            """ for example: ----{
  "ingredients": [
    {
      "item": "Tomatoes",
      "quantity": "Approximately 6 tomatoes"
    },
    {
      "item": "Bell Peppers",
      "quantity": "Includes at least 1 red bell pepper and 1 yellow bell pepper"
    },----"""
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