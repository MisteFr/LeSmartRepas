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
                    give the respones in the following json format:
                    {
                        "name": "Name of the plate",
                        "ingredients": "List of ingredients used and associated quantity",
                        "howToPrepare": "Quick description of how to prepare the meal beginner friendly"
                    }
                    
                    Here are the available ingredients:
                    ingredients:'''