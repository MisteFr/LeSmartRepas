analyse_in_fridge = '''(
                            "Please analyze these images of the inside of a fridge. I would like a detailed list "
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
                    give the respones in the following json format:
                    {
                        "name": "Tomato Salad",
                        "ingredients": [
                            {"item": "Tomatoes", "quantity": "3"},
                            {"item": "Carrots", "quantity": "2"},
                            {"item": "Green onions", "quantity": "a few"},
                            {"item": "Salad dressing", "quantity": "a few tablespoons"}
                        ]
                    },
                    {
                        "name": "Ketchup and Egg Sandwich",
                        "ingredients": [
                            {"item": "Ketchup", "quantity": "a few tablespoons"},
                            {"item": "Eggs", "quantity": "2"},
                            {"item": "Bread", "quantity": "2 slices"}
                        ]
                    }
                    
                    ingredients:'''

generate_shopping = '''Given the list of ingredients and the personal preferences create a list of items not in the fridge that are needed to provide the required personal preferences
                    Use the "preferences", "restrictions", "goalType", "goalDetails" to decide what is needed to add to the list of ingredients to acheive his goaals/requirements
                    create a shopping list
                    respond as json
                    ingredients:'''