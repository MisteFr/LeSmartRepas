analyse_in_fridge = '''(
                            "Please analyze this image of the inside of a fridge. I would like a detailed list "
                            "of all identifiable ingredients, including food items, condiments, and beverages, as well as "
                            "an approximate quantity for each. For example, if there is a bottle of milk, specify whether it's "
                            "full, half-full, or nearly empty. Be as specific as possible about the types of ingredients "
                            "(e.g., cheddar cheese vs. generic cheese, green peppers vs. red peppers) and give approximate quantities"
                            "where possible (e.g., '2 apples,' '1 half-full bottle of orange juice,' etc.). Answer with a json format following the following style"
                            """ for example: ----{
  "ingredients": [
    {
      "item": "Tomatoes",
      "quantity": "6"
    },
    {
      "item": "Bell Peppers",
      "quantity": "2"

    }...,----"""
                        )
                    '''

generate_recipes = '''Given the list of items in a fridge suggest possible recipes that I can make
                    Give the response in the following json format:
                    [{
                        "name": "Name of the plate1",
                        "ingredients": "List of ingredients used and associated quantity eg:  - Ingredient1: quantity \\n - Ingredient2: quantity, etc..",
                        "howToPrepare": "Quick description of how to prepare the meal beginner friendly eg: 1. Crack the eggs into a pan greased with olive oil and scramble until fully cooked.\\n2. Dice the tomatoes and onions.\\netc"
                    },
                    {
                      "name": "Name of the plate2",
                      etc..
                      
                    },
                    ..
                    ]
                    If it's not possible to use only available ingreidents to fullfill every nutrional requirements, don't send back JSON and just explain it.
                    Here are the ONLY available ingredients, don't use anything that's not from the following list:
                    ingredients:'''
                    
generate_shopping = '''Given the list of ingredients and the personal preferences create a list of items not in the fridge that are needed to provide the required personal preferences
                    Use the "preferences", "restrictions", "goalType", "goalDetails" to decide what is needed to add to the list of ingredients to acheive his goaals/requirements
                    Give the answer in the following JSON format:
                    [{
                        "name": "Name of the ingredient",
                        "Reason": "Short sentence about why it's good",
                    },
                    {
                      "name": "Name of the ingreddient2",
                      etc..
                      
                    },
                    ..
                    ]
                    Here are the ONLY available ingredients in the fridge
                    ingredients:'''