analyse_in_fridge = '''(
                            "Please analyze this image of the inside of a fridge. I would like a detailed list "
                            "of all identifiable ingredients, including food items, condiments, and beverages, as well as "
                            "an approximate quantity for each. For example, if there is a bottle of milk, specify whether it's "
                            "full, half-full, or nearly empty. Be as specific as possible about the types of ingredients "
                            "(e.g., cheddar cheese vs. generic cheese, green peppers vs. red peppers) and give approximate quantities"
                            "Give the location of the answer as a 4 fig grid reference"
                            "where possible (e.g., '2 apples,' '1 half-full bottle of orange juice,' etc.). Answer with a json format following the following style"
                            """ for example: ----{
  "ingredients": [
    {
      "item": "Tomatoes",
      "quantity": "6",
      "location": 4536
    },
    {
      "item": "Bell Peppers",
      "quantity": "2",
      "location": 3456

    }...,----"""
                        )
                    '''