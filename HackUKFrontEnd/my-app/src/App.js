import React, { useState, useEffect, useRef } from "react";
import {
  CssVarsProvider,
  Container,
  Box,
  Typography,
  Select,
  Option,
  Button,
  Input,
  Checkbox,
  Textarea,
  CircularProgress,
} from "@mui/joy";
import io from "socket.io-client";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

function App() {
  const [preferences, setPreferences] = useState({
    vegetarian: false,
    highProtein: false,
    lowCarb: false,
    vegan: false,
  });
  const [restrictions, setRestrictions] = useState("");
  const [goalType, setGoalType] = useState("");
  const [goalDetails, setGoalDetails] = useState("");
  const [meals, setMeals] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [image, setImage] = useState(null); // State to store uploaded image
  const [loading, setLoading] = useState(false); // State to show loading while processing
  const [ingredients, setIngredients] = useState([]); // State to store ingredients list
  const [calories, setCalories] = useState(null); // New state for calories
  const [isNutritionalSetupOpen, setIsNutritionalSetupOpen] = useState(true); // Toggle for collapsible form
  const [isIngredientsListOpen, setIsIngredientsListOpen] = useState(true); // Toggle for collapsible form
  const [isUploadFileSetupOpen, setIsUploadFileSetupOpen] = useState(true); // Toggle for collapsible form
  const [isMealPreparationOpen, setIsMealPreparationOpen] = useState(false); // Toggle for collapsible form
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(true); // Toggle for collapsible form
  const [isFilledFromStorage, setIsFilledFromStorage] = useState(false); // Track if data loaded from storage
  const socketRef = useRef();

  // Initialize WebSocket connection to the backend
  if (!socketRef.current) {
    socketRef.current = io("http://localhost:5001", {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }

  // Load data from session storage on page load
  useEffect(() => {
    const storedData = JSON.parse(sessionStorage.getItem("nutritionalSetup"));
    if (storedData) {
      setPreferences((prev) => ({
        ...prev,
        vegetarian: storedData.preferences.includes("vegetarian"),
        highProtein: storedData.preferences.includes("highProtein"),
        lowCarb: storedData.preferences.includes("lowCarb"),
        vegan: storedData.preferences.includes("vegan"),
      }));
      setRestrictions(storedData.restrictions);
      setGoalType(storedData.goalType);
      setGoalDetails(storedData.goalDetails);
      setIsNutritionalSetupOpen(false);
      setIsFilledFromStorage(true);
    }
  }, []);

  // Load data from localStorage on page load
  useEffect(() => {
    const storedIngredients = JSON.parse(
      localStorage.getItem("ingredientsList")
    );
    if (storedIngredients && storedIngredients.length > 0) {
      setIngredients(storedIngredients);
      setIsUploadFileSetupOpen(false);
      socketRef.current.emit("request_recipes");
    }
  }, []);

  // Clear the ingredients list both from state and localStorage
  const handleClearIngredients = () => {
    setIngredients([]);
    localStorage.removeItem("ingredientsList");
  };

  // Handle settings form submission
  const handleSettingsSubmit = async (event) => {
    event.preventDefault();

    const selectedPreferences = Object.keys(preferences).filter(
      (key) => preferences[key]
    );

    const userData = {
      preferences: selectedPreferences,
      restrictions,
      goalType,
      goalDetails,
    };

    // Save the user data to session storage
    sessionStorage.setItem("nutritionalSetup", JSON.stringify(userData));

    // Send data to the backend
    socketRef.current.emit("submit_user_data", userData);

    // Collapse form if filled in
    setIsNutritionalSetupOpen(false);
    setIsFilledFromStorage(true);
  };

  // Handle checkbox changes for preferences
  const handlePreferenceChange = (event) => {
    const { name, checked } = event.target;
    setPreferences((prev) => ({ ...prev, [name]: checked }));
  };

  // Handle image submission
  const handleImageSubmit = async (event) => {
    event.preventDefault();
    if (image) {
      setLoading(true);

      // Convert the image to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result.split(",")[1]; // Only send the base64 part
        socketRef.current.emit("submit_image", { image: base64Image });
      };
      reader.readAsDataURL(image);
    }
  };

  // Handle file change for image upload
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  // Handle response from backend, append new ingredients to the list
  socketRef.current.on("response", (data) => {
    if (data.ingredients) {
      console.log(data.ingredients)
      setIngredients(data.ingredients.ingredients);
      localStorage.setItem('ingredientsList', JSON.stringify(data.ingredients.ingredients));
      setLoading(false);
      setIsUploadFileSetupOpen(false);

      //waiting for meals next
      setMeals([])
      setIsMealPreparationOpen(false);
    }
    if (data.calories) {
      setCalories(data.calories);
    }
    if(data.recipes) {
      setMeals(data.recipes); // Save the recipes to the new state variable
      setIsMealPreparationOpen(true); // Automatically open the meal section
      //socketRef.current.emit("get_shopping");
    }
    if(data.messageRecipes){
      const message = data.messageRecipes;
      setMeals([{ message }]);  // Store the message in an array to treat it as a "meal"
      setIsMealPreparationOpen(true);
    }
    if(data.shopping){
      setShoppingList(data.shopping)
      setIsShoppingListOpen(true)
    }
  });

  // Handle changes in the table
  const handleItemChange = (index, field, value) => {
    const updatedIngredients = ingredients.map((ingredient, i) =>
      i === index ? { ...ingredient, [field]: value } : ingredient
    );
    setIngredients(updatedIngredients);
    localStorage.setItem("ingredientsList", JSON.stringify(ingredients));
  };

  // Add new row to the ingredients table
  const handleAddRow = () => {
    setIngredients([...ingredients, { item: "", quantity: "" }]);
    localStorage.setItem("ingredientsList", JSON.stringify(ingredients));
  };

  // Remove a specific row from the ingredients table
  const handleRemoveRow = (index) => {
    const updatedIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(updatedIngredients);
    localStorage.setItem("ingredientsList", JSON.stringify(ingredients));
  };

  const handleSaveChanges = () => {
    localStorage.setItem("ingredientsList", JSON.stringify(ingredients));
    console.log("Updated Ingredients:", ingredients);
    // Send data to the backend
    socketRef.current.emit("save_ingredients", JSON.stringify(ingredients));
    setIsIngredientsListOpen(false)
    setMeals([])
    setIsMealPreparationOpen(false);
    setShoppingList([])
    setIsShoppingListOpen(false);
  };

  return (
    <CssVarsProvider>
      <Container
        maxWidth={false}
        sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        {/* Centered Title with Fridge Emoji */}
        <Box
          sx={{
            width: "100%",
            backgroundColor: "#f0f0f0",
            padding: "20px",
            textAlign: "center",
            marginBottom: "20px"
          }}
        >
          <Typography
            level="h1"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            LeSmartRepas 🧊
          </Typography>
          <br></br>
          <Typography
              level="h2"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "4px",
                fontSize: "16px",
                color: "#555", // Optional: color of the subheader text
              }}
            >
              Powered by 
              <img 
                src="icon.svg" 
                style={{ width: '30px', height: '30px', marginLeft: '10px' }} 
              />
            </Typography>
        </Box>

        {/* Nutritional Setup Section */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "900px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "20px"
          }}
        >
          <Box sx={{ width: "100%", maxWidth: "900px", marginBottom: "20px" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography level="h2" sx={{ display: "inline-block" }}>
                Nutritional Setup
              </Typography>
              {isFilledFromStorage && (
                <CheckCircleIcon
                  sx={{ color: "green", ml: 1, verticalAlign: "middle" }}
                />
              )}
              <Button
                variant="outlined"
                onClick={() =>
                  setIsNutritionalSetupOpen(!isNutritionalSetupOpen)
                }
                sx={{ textTransform: "none", marginLeft: "auto" }}
              >
                {isNutritionalSetupOpen ? "Collapse" : "Edit"}
              </Button>
            </Box>

            {isNutritionalSetupOpen && (
              <Box
                component="form"
                onSubmit={handleSettingsSubmit}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  width: "100%",
                }}
              >
                {/* User Inputs: Nutritional Preferences (with Checkboxes) */}
                <Typography level="h3">Nutritional Preferences</Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 2,
                    width: "100%"
                  }}
                >
                  <Checkbox
                    label="Vegetarian"
                    checked={preferences.vegetarian}
                    onChange={handlePreferenceChange}
                    name="vegetarian"
                  />
                  <Checkbox
                    label="High-Protein"
                    checked={preferences.highProtein}
                    onChange={handlePreferenceChange}
                    name="highProtein"
                  />
                  <Checkbox
                    label="Low-Carb"
                    checked={preferences.lowCarb}
                    onChange={handlePreferenceChange}
                    name="lowCarb"
                  />
                  <Checkbox
                    label="Vegan"
                    checked={preferences.vegan}
                    onChange={handlePreferenceChange}
                    name="vegan"
                  />
                </Box>

                {/* Dietary Restrictions */}
                <Typography level="h3">Dietary Restrictions</Typography>
                <Textarea
                  placeholder="List your dietary restrictions (e.g., allergies, intolerances)"
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                  required
                  minRows={3}
                  maxRows={5}
                  sx={{ width: "100%", marginBottom: "20px" }}
                />

                {/* Nutritional Goals */}
                <Typography level="h3">Nutritional Goals</Typography>
                <Select
                  value={goalType}
                  onChange={(e, newValue) => setGoalType(newValue)}
                  placeholder="Select your goal"
                  required
                  sx={{ width: "100%" }}
                >
                  <Option value="calorie-limit">Calorie Limit</Option>
                  <Option value="macro-balance">
                    Macro Balance (Protein, Fat, Carbs)
                  </Option>
                  <Option value="nutrient-focus">
                    Nutrient Focus (Iron, Vitamin C, etc.)
                  </Option>
                </Select>

                {/* Nutritional Goal Details */}
                <Textarea
                  placeholder="Describe your goal in detail (e.g., daily calorie limit, macro ratio, specific nutrients)"
                  value={goalDetails}
                  onChange={(e) => setGoalDetails(e.target.value)}
                  required
                  minRows={3}
                  maxRows={5}
                  sx={{ width: "100%" }}
                />

                <Button
                  type="submit"
                  variant="solid"
                  color="primary"
                  sx={{ mt: 2 }}
                >
                  Submit
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        {/* Animated Line */}
        <div className={'animated-line'} />

        {/* Upload Image */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "900px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "20px"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography level="h2">Upload Image</Typography>
            {ingredients.length > 0 ? (
              <CheckCircleIcon
                sx={{ color: "green", ml: 1, verticalAlign: "middle" }}
              />
            ) : (
              loading && <CircularProgress size="sm" sx={{ ml: 1, verticalAlign: "middle" }} />
            )}
            <Button
              variant="outlined"
              onClick={() => setIsUploadFileSetupOpen(!isUploadFileSetupOpen)}
              sx={{ textTransform: "none", marginLeft: "auto" }}
            >
              {isUploadFileSetupOpen ? "Collapse" : "Edit"}
            </Button>
          </Box>

          {isUploadFileSetupOpen && (
            <Box
              component="form"
              onSubmit={handleImageSubmit}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                sx={{
                  mb: 2,
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  width: "100%",
                  "&:hover": {
                    borderColor: "#007bff",
                  },
                  "&:focus": {
                    outline: "none",
                    borderColor: "#007bff",
                    boxShadow: "0 0 0 2px rgba(0, 123, 255, 0.25)",
                  },
                }}
              />
              <Button
                type="submit"
                variant="solid"
                color="primary"
                disabled={!image || loading}
              >
                {loading ? <CircularProgress size="sm" /> : "Submit Image"}
              </Button>
            </Box>
          )}
        </Box>
        
          {/* Calories
          {calories !== null && (
            <Box sx={{ mt: 4 }}>
              <Typography level="h3" mb={2}>
                Estimated Calories: {calories}
              </Typography>
            </Box>
          )} */}

        <div className={ingredients.length == 0 ? 'animated-line-grey' : 'animated-line'} />
          
        <Box
          sx={{
            width: "100%",
            maxWidth: "900px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "20px"
          }}
        >

        <Box sx={{ width: "100%", maxWidth: "900px", marginBottom: "20px" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography level="h2" sx={{ display: "inline-block" }}>
                Ingredients List
              </Typography>
              {ingredients.length > 0 && (
                <CheckCircleIcon
                  sx={{ color: "green", ml: 1, verticalAlign: "middle" }}
                />
              )}
              <Button
                variant="outlined"
                onClick={() =>
                  setIsIngredientsListOpen(!isIngredientsListOpen)
                }
                sx={{ textTransform: "none", marginLeft: "auto" }}
              >
                {isIngredientsListOpen ? "Collapse" : "Edit"}
              </Button>
            </Box>

          {/* Ingredients Table */}
          {ingredients.length > 0 && isIngredientsListOpen && (
            <Box sx={{ mt: 4 }}>
              <Typography level="h3" mb={2}>
                Detected Ingredients
              </Typography>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                      Item
                    </th>
                    <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                      Quantity
                    </th>
                    {/* <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                      Location
                    </th> */}
                    <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ingredient, index) => (
                    <tr key={index}>
                      <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                        <Input
                          value={ingredient.item}
                          onChange={(e) =>
                            handleItemChange(index, "item", e.target.value)
                          }
                          sx={{ width: "100%" }}
                        />
                      </td>
                      <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                        <Input
                          value={ingredient.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", e.target.value)
                          }
                          sx={{ width: "100%" }}
                        />
                      </td>
                      {/* <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                        <Input
                          value={ingredient.location}
                          onChange={(e) =>
                            handleItemChange(index, "location", e.target.value)
                          }
                          sx={{ width: "100%" }}
                        />
                      </td> */}
                      <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", verticalAlign: "middle" }}>
                        <Button
                          variant="solid"
                          color="danger"
                          onClick={() => handleRemoveRow(index)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 0.5,
                  mt: 2,
                }}
              >
                <Button variant="solid" color="primary" onClick={handleAddRow}>
                  Add Row
                </Button>
                <Button
                  variant="solid"
                  color="primary"
                  onClick={handleSaveChanges}
                >
                  Save Changes
                </Button>
                <Button
                  variant="solid"
                  color="danger"
                  onClick={handleClearIngredients}
                >
                  Clear List
                </Button>
              </Box>
            </Box>
          )}
          </Box>
          </Box>

        {/* Meal Preparation Section */}

        <div className={meals.length == 0 ? 'animated-line-grey' : 'animated-line'} />

        <Box
          sx={{
            width: "100%",
            maxWidth: "900px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px", // Add more margin between meals
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography level="h2" sx={{ display: "inline-block", color: "black" }}>
              Suggested Meals
            </Typography>
            {meals.length > 0 ? (
              <CheckCircleIcon
                sx={{ color: "green", ml: 1, verticalAlign: "middle" }}
              />
            ) : (
              ingredients.length > 0 && (
              <CircularProgress size="sm" sx={{ ml: 1, verticalAlign: "middle" }} />
            ))}
            <Button
              variant="outlined"
              onClick={() => setIsMealPreparationOpen(!isMealPreparationOpen)}
              sx={{ textTransform: "none", marginLeft: "auto" }}
            >
              {isMealPreparationOpen ? "Collapse" : "Open"}
            </Button>
          </Box>

          {/* Meal List */}
          {isMealPreparationOpen && meals.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
              {meals.map((meal, index) => (
                <li 
                  key={index} 
                  style={{ 
                    marginBottom: "40px", 
                    padding: "20px", 
                    border: "1px solid #ddd", // Add a border around each meal
                    borderRadius: "8px"  // Optional: add rounded corners
                  }}
                >

              {meal.message ? (
                    <Typography variant="h6" sx={{ color: "black" }}>
                      {meal.message}
                    </Typography>
                  ) : (
                    <>
                  {/* Meal Name */}
                  <Typography variant="h5" mb={1} sx={{ color: "black" }}>
                    <strong>Meal Name:</strong> {meal.name}
                  </Typography>

                  {/* Ingredients List */}
                  <Typography variant="body1" mb={1} sx={{ color: "black" }}>
                    <strong>Ingredients:</strong>
                    <ul>
                      {meal.ingredients.split("\n").map((ingredient, idx) => (
                        <li key={idx} style={{ marginLeft: "20px" }}>{ingredient.replace("-", "").trim()}</li>
                      ))}
                    </ul>
                  </Typography>

                  {/* How to Prepare */}
                  <Typography variant="body1" mb={2} sx={{ color: "black" }}>
                    <strong>How to Prepare:</strong>
                    <ol>
                      {meal.howToPrepare.split("\n").map((instruction, idx) => (
                        <li key={idx} style={{ marginLeft: "20px", marginTop: "10px" }}>
                          {instruction.replace(/^\d+\.\s*/, '')}
                        </li>
                      ))}
                    </ol>
                  </Typography>
                  </>
                )}
                </li>
              ))}
              </ul>
            </Box>
          )}
        </Box>

        <div className={shoppingList.length == 0 ? 'animated-line-grey' : 'animated-line'} />

        {/* Shopping List Section */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "900px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px", // Add more margin between shopping list items
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography level="h2" sx={{ display: "inline-block", color: "black" }}>
              Shopping List
            </Typography>
            {shoppingList.length > 0 ? (
              <CheckCircleIcon
                sx={{ color: "green", ml: 1, verticalAlign: "middle" }}
              />
            ) : (
              ingredients.length > 0 && (
              <CircularProgress size="sm" sx={{ ml: 1, verticalAlign: "middle" }} />
            ))}
            <Button
              variant="outlined"
              onClick={() => setIsShoppingListOpen(!isShoppingListOpen)}
              sx={{ textTransform: "none", marginLeft: "auto" }}
            >
              {isShoppingListOpen ? "Collapse" : "Open"}
            </Button>
          </Box>

          {/* Shopping List */}
          {isShoppingListOpen && shoppingList.length > 0 && (
            <Box sx={{ mt: 2 }}> {/* Reduced margin-top */}
              <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                {shoppingList.map((item, index) => (
                  <li
                    key={index}
                    style={{
                      marginBottom: "10px", // Reduced margin between items
                      padding: "8px", // Reduced padding for each item
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                    }}
                  >
                    <Typography variant="h6" mb={1} sx={{ color: "black", fontSize: "1rem" }}> {/* Smaller font size */}
                      <strong>{item.name}</strong> - {item.Reason}
                    </Typography>
                  </li>
                ))}
              </ul>
            </Box>
          )}

        </Box>
        <Box
  sx={{
    width: "100%",
    backgroundColor: "#f0f0f0",
    padding: "10px",
    textAlign: "center",
    marginTop: "20px", /* Adds space above the footer */
  }}
>
  <Typography
    level="body2"
    sx={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",     
      color: "#555", // Optional: Text color for the footer
    }}
  >
    Authors: Arthur Bigot, Jacob Davis, Giuliano Costa
  </Typography>
</Box>

        
      </Container>

      <style jsx>{`
        .animated-line {
  width: 4px; /* Narrow width for vertical line */
  height: 30px; /* Height can be adjusted based on your needs */
  background: linear-gradient(180deg, rgb(248, 207, 70), rgb(235, 51, 38)); /* Vertical gradient */
  background-size: 100% 200%; /* The gradient is twice the height of the element */
    background-position: 0 0; /* Start the gradient at the top */
  margin: 20px 0; /* Adjust margin between sections */
  animation: flow-down 2s infinite linear; 
}

.animated-line-grey {
    width: 4px;
    height: 30px;
    background: grey; /* Solid grey background */
    margin: 20px 0;
    animation: none; /* Remove animation if desired, otherwise you can keep it */
  }

/* Animation to make the line grow in height */
@keyframes flow-down {
    0% {
      background-position: 0 0; /* Yellow at top, orange at bottom */
    }
    50% {
      background-position: 0 100%; /* Orange moves up, yellow moves down */
    }
    100% {
      background-position: 0 0; /* Reset to yellow at top */
    }
  }

      `}</style>

    </CssVarsProvider>
  );
}

export default App;
