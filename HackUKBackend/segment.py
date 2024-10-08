import cv2
import numpy as np
import os
from PIL import Image
from utils import encode_image_base64

def segmentN(pil_image, output_folder='segments', num_top_components=7):
    """
    Extracts all components from the PIL image, saves them individually, 
    and removes the top `num_top_components` from the original unthresholded image.

    Args:
        pil_image (PIL.Image.Image): The input PIL image.
        output_folder (str): The folder where components will be saved.
        num_top_components (int): The number of top components to remove from the image. Default is 7.

    Returns:
        list: A list containing the cropped components and the image with the top components removed, all as PIL images.
              The first `n` items are the cropped components, and the last item is the image
              with the top `num_top_components` removed.
    """
    
    # Convert PIL image to a NumPy array (OpenCV requires a NumPy array)
    image = np.array(pil_image)

    # Convert the image to BGR format if it's in RGBA or RGB format
    if pil_image.mode == 'RGBA' or pil_image.mode == 'RGB':
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    # Create the output folder if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply thresholding to segment the image
    _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)

    # Find contours (which represent different components)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Sort contours by area in descending order
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    # Initialize a mask for the top `num_top_components` largest components
    top_mask = np.zeros_like(gray)

    # Draw the top `num_top_components` contours on the mask
    for contour in contours[:num_top_components]:
        cv2.drawContours(top_mask, [contour], -1, 255, thickness=cv2.FILLED)

    # Invert the top mask (so the top components are removed from the final image)
    inverse_mask = cv2.bitwise_not(top_mask)

    # Use the inverted mask to remove the top components from the **original** image (unthresholded)
    image_without_top_components = cv2.bitwise_and(image, image, mask=inverse_mask)

    # Initialize a list to store the cropped components
    result_images = []

    # Loop through all contours and save each component
    for i, contour in enumerate(contours[:num_top_components]):
        # Create a mask for each specific component
        component_mask = np.zeros_like(gray)
        
        # Draw the specific contour on the mask
        cv2.drawContours(component_mask, [contour], -1, 255, thickness=cv2.FILLED)
        
        # Use the mask to extract the component from the original image
        component_image = cv2.bitwise_and(image, image, mask=component_mask)
        
        # Find the bounding rectangle of the contour
        x, y, w, h = cv2.boundingRect(contour)
        
        # Crop the component image to the bounding rectangle
        cropped_component = component_image[y:y+h, x:x+w]
        
        # Convert the cropped component back to PIL image
        cropped_pil = Image.fromarray(cv2.cvtColor(cropped_component, cv2.COLOR_BGR2RGB))
        
        # Append the cropped PIL image to the results list
        result_images.append(cropped_pil)

    # Convert the image without top components back to PIL image
    image_without_top_components_pil = Image.fromarray(cv2.cvtColor(image_without_top_components, cv2.COLOR_BGR2RGB))
    
    print(encode_image_base64(image_without_top_components_pil))
    
    # Append the image with the top components removed to the results list
    result_images.append(encode_image_base64(image_without_top_components_pil))

    print(len(result_images))

    # Return the list of PIL images
    return result_images