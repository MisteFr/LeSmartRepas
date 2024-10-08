## Inspiration

The inspiration for LeSmartRepas came from the daily challenge of meal planning and grocery shopping. We noticed that many people struggle to decide what to cook with the ingredients they already have at home and often waste food as a result. We wanted to create an app that would not only help reduce food waste but also assist people in making healthier choices by generating meal plans tailored to their nutritional needs. Our goal was to make meal planning easy, efficient, and personalized.

## What it does

LeSmartRepas uses AI-powered image recognition (Mistral AI) to scan your fridge, detecting the ingredients you already have. Based on your personal nutritional profile—whether you're following a specific diet or aiming for balanced meals—the app suggests a variety of meal options you can make. It also generates a shopping list for missing ingredients, ensuring you always have what you need to create healthy, delicious meals. The app adapts to your preferences, goals, and habits, making meal planning both effortless and personalized.

## How we built it

We built LeSmartRepas using a combination of machine learning for image recognition (segmenting the image then doing object detection and then using Mistral AI Vision capabilities). We are using natural language processing to suggest meals and shopping list. The frontend is developed in React, while the backend leverages a Python-based AI model to detect ingredients and generate meal suggestions. Additionally, we incorporated a user profile system that captures dietary preferences and nutritional goals to personalize meal suggestions.

## Challenges we ran into

One of the biggest challenges was ensuring the accuracy of ingredient detection from fridge photos, especially when dealing with non-standard packaging or partially hidden items.

## Accomplishments that we're proud of

We're proud of creating a seamless user experience that bridges the gap between what people have in their kitchens and what they can make. Successfully integrating AI to accurately detect ingredients and providing relevant meal suggestions based on personal preferences is a significant achievement. We’re also proud of reducing food waste by making it easier for users to use up the ingredients they have, while ensuring that their meals align with their nutritional goals.

## What we learned

Through this project, we learned a lot about machine learning models for image recognition and the complexities of integrating AI into a practical application like meal planning. We gained insights into how users interact with AI-generated suggestions and how to make the process more intuitive and get better results through prompt engineering.
