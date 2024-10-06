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
def mistral(images, client, model, text, personal_details = None):
    messages = {"role": "user",
                "content": []}
        

    #Add personal details
    if personal_details != None:
        messages["content"].append({
                        "type": "text",
                        "text": ("Take into consideration these requirements when answering the question: --" + str(personal_details) + "--")
                    })
    
    #Add text
    if text != None:
        messages["content"].append({
                        "type": "text",
                        "text": (text)
                    })
    
    #Add image  
    if images != None:
        # Convert the image to base64 string
        for image in images:
            image_base64 = encode_image_base64(image)
            messages["content"].append({
                            "type": "image_url",
                            "image_url": f"data:image/jpeg;base64,{image_base64}"
                        })
        
    print(messages)
        
    # Prepare the request payload
    chat_response = client.chat.complete(
        model=model,
        messages = [messages]
    )
    
    # Get the response content
    return chat_response.choices[0].message.content