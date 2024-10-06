from PIL import Image
import base64
from mistralai import Mistral
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import json
from utils import decode_image_base64, encode_image_base64, save_ingredients_as_json
from llms import mistral
from prompts import analyse_in_fridge

def update_ingredients(image, client, model):
    # Analyze the image and get the ingredients list
    ingredients = mistral(image, client, model, analyse_in_fridge)
    # Save the ingredients as JSON locally
    ingredientsJson = save_ingredients_as_json(ingredients, file_name="ingredients.json")