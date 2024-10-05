import os
from dotenv import load_dotenv
from google.cloud import vision_v1
from PIL import Image, ImageDraw, ImageFont

# Load the .env file
load_dotenv()

# Set up the client
client = vision_v1.ImageAnnotatorClient()


def detect_items(image_path):
    with open(image_path, "rb") as image_file:
        content = image_file.read()

    image = vision_v1.Image(content=content)

    # Perform label detection
    label_response = client.label_detection(image=image)
    labels = label_response.label_annotations

    # Perform object localization
    object_response = client.object_localization(image=image)
    objects = object_response.localized_object_annotations

    return labels, objects


def is_food_related(label):
    food_keywords = [
        "food",
        "fruit",
        "vegetable",
        "meat",
        "dairy",
        "beverage",
        "drink",
        "snack",
        "produce",
    ]
    return any(keyword in label.lower() for keyword in food_keywords)


def draw_items_on_image(image_path, objects, labels):
    image = Image.open(image_path)
    draw = ImageDraw.Draw(image)

    try:
        font = ImageFont.truetype("arial.ttf", 15)
    except IOError:
        font = ImageFont.load_default()

    for obj in objects:
        box = [
            (vertex.x * image.width, vertex.y * image.height)
            for vertex in obj.bounding_poly.normalized_vertices
        ]

        color = "#00ff00" if is_food_related(obj.name) else "#ff0000"
        draw.line(box + [box[0]], width=3, fill=color)

        label = f"{obj.name}: {obj.score:.2f}"
        draw.text((box[0][0], box[0][1] - 20), label, font=font, fill=color)

    return image


def main():
    image_path = "./data/fridge_1.jpg"

    labels, objects = detect_items(image_path)

    labeled_image = draw_items_on_image(image_path, objects, labels)

    output_path = "labeled_fridge_items.jpg"
    labeled_image.save(output_path)

    print(f"Labeled image saved as {output_path}")
    print("Items detected in the fridge:")
    for label in labels:
        food_indicator = (
            " (likely food item)" if is_food_related(label.description) else ""
        )
        print(f"- {label.description}{food_indicator} (confidence: {label.score:.2f})")


if __name__ == "__main__":
    main()
