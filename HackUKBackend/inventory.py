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
from segment import segmentN
from PIL import Image
import os

def update_ingredients(image, client, model):
    #SEGMENTATION
    images = segmentN(image)

    output_folder = 'segments2'
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Save each image in the array
    for idx, img in enumerate(images):
        # Define the path where the image will be saved
        img_path = os.path.join(output_folder, f'image_{idx}.png')
        
        # Save the image in png format (you can change the format if needed)
        img.save(img_path)
    #SEGMENTATION

    # Analyze the image and get the ingredients list
    ingredients = mistral(images, client, model, analyse_in_fridge)
    # Save the ingredients as JSON locally
    ingredientsJson = save_ingredients_as_json(ingredients, file_name="ingredients.json")