from PIL import Image
import base64
from mistralai import Mistral
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import json
from utils import decode_image_base64, encode_image_base64, save_ingredients_as_json
from llms import analyze_image_with_pixtral

def update_ingredients(image, client, model):
    # Analyze the image and get the ingredients list
    ingredients = analyze_image_with_pixtral(image, client, model)
    
    # Save the ingredients as JSON locally
    ingredientsJson = save_ingredients_as_json(ingredients, file_name="ingredients.json")

def get_ingredients(file_path='ingredients.json'):
    try:
        with open(file_path, 'r') as file:
            ingredients = json.load(file)
            return ingredients
    except FileNotFoundError:
        print(f"The file {file_path} does not exist.")
        return None
    except json.JSONDecodeError:
        print(f"The file {file_path} does not contain valid JSON.")
        return None