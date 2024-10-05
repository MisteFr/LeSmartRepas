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
def mistral(image, client, model, text):
    # Convert the image to base64 string
    image_base64 = encode_image_base64(image)
    print("called")
    
    # Prepare the request payload
    chat_response = client.chat.complete(
        model=model,
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (text)
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