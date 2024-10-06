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
  const [image, setImage] = useState(null); // State to store uploaded image
  const [loading, setLoading] = useState(false); // State to show loading while processing
  const [ingredients, setIngredients] = useState([]); // State to store ingredients list
  const [calories, setCalories] = useState(null); // New state for calories
  const [isNutritionalSetupOpen, setIsNutritionalSetupOpen] = useState(true); // Toggle for collapsible form
  const [isIngredientsListOpen, setIsIngredientsListOpen] = useState(true); // Toggle for collapsible form
  const [isUploadFileSetupOpen, setIsUploadFileSetupOpen] = useState(true); // Toggle for collapsible form
  const [isMealPreparationOpen, setIsMealPreparationOpen] = useState(true); // Toggle for collapsible form
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
    if (storedIngredients) {
      setIngredients(storedIngredients);
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
    }
    if (data.calories) {
      setCalories(data.calories);
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
            marginBottom: "20px",
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
        </Box>

        {/* Nutritional Setup Section */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "900px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px",
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
                    width: "100%",
                    marginBottom: "20px",
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

        {/* Upload Image */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "900px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography level="h2">Upload Image</Typography>
            {ingredients.length > 0 && (
              <CheckCircleIcon
                sx={{ color: "green", ml: 1, verticalAlign: "middle" }}
              />
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

          
        <Box
          sx={{
            width: "100%",
            maxWidth: "900px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px"
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

        <Box
          sx={{
            width: "100%",
            maxWidth: "900px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px"
          }}
        >


        <Box sx={{ width: "100%", maxWidth: "900px", marginBottom: "20px" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography level="h2" sx={{ display: "inline-block" }}>
                Meal Preparation
              </Typography>
              {/* {isFilledFromStorage && (
                <CheckCircleIcon
                  sx={{ color: "green", ml: 1, verticalAlign: "middle" }}
                />
              )} */}
              <Button
                variant="outlined"
                onClick={() =>
                  setIsMealPreparationOpen(!isMealPreparationOpen)
                }
                sx={{ textTransform: "none", marginLeft: "auto" }}
              >
                {isMealPreparationOpen ? "Collapse" : "Open"}
              </Button>
            </Box>

            </Box>
          </Box>


          <Box
          sx={{
            width: "100%",
            maxWidth: "900px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px"
          }}
        >


        <Box sx={{ width: "100%", maxWidth: "900px", marginBottom: "20px" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography level="h2" sx={{ display: "inline-block" }}>
                Shopping List
              </Typography>
              {/* {isFilledFromStorage && (
                <CheckCircleIcon
                  sx={{ color: "green", ml: 1, verticalAlign: "middle" }}
                />
              )} */}
              <Button
                variant="outlined"
                onClick={() =>
                  setIsShoppingListOpen(!isShoppingListOpen)
                }
                sx={{ textTransform: "none", marginLeft: "auto" }}
              >
                {isShoppingListOpen ? "Collapse" : "Open"}
              </Button>
            </Box>

            </Box>
          </Box>
        
      </Container>
    </CssVarsProvider>
  );
}

export default App;
