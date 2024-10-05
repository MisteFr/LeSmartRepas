import React, { useState, useRef } from "react";
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

function App() {
  // State for user preferences
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
  const [ingredients, setIngredients] = useState([]); // State to store ingredients list from backend
  const [calories, setCalories] = useState(null); // New state for calories
  const socketRef = useRef();

  // Initialize WebSocket connection to the backend
  if (!socketRef.current) {
    socketRef.current = io("http://localhost:5001", {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }

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

    // Send data to the backend
    socketRef.current.emit("submit_user_data", userData);

    // Reset form after submission
    setRestrictions("");
    setGoalType("");
    setGoalDetails("");
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

  // Handle response from backend
  socketRef.current.on("response", (data) => {
    if (data.ingredients) {
      console.log("Received Ingredients:", data.ingredients); // Debugging: Check if ingredients are received
      setIngredients(data.ingredients.ingredients);
      setLoading(false);

      console.log(ingredients);
    }
    if (data.calories) {
      setCalories(data.calories);
    }
  });

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
          {/* Centered Title with Fridge Emoji */}
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

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            width: "90%",
          }}
        >
          {/* Left Side: Settings Form */}
          <Box
            sx={{
              flex: 1,
              maxWidth: "58%",
              textAlign: "center",
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "20px",
            }}
          >
            <Typography level="h2" mb={5}>
              Nutritional Setup
            </Typography>

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
          </Box>

          {/* Right Side: Image Upload and Ingredients Table */}
          <Box
            sx={{
              flex: 1,
              maxWidth: "58%",
              textAlign: "center",
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "20px",
              marginLeft: "20px",
            }}
          >
            <Typography level="h2" mb={5}>
              Upload Image & Ingredients
            </Typography>

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
            {/* Calories */}
            {calories !== null && (
              <Box sx={{ mt: 4 }}>
                <Typography level="h3" mb={2}>
                  Estimated Calories: {calories}
                </Typography>
              </Box>
            )}
            {/* Ingredients Table */}
            {ingredients.length > 0 && (
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
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map((ingredient, index) => (
                      <tr key={index}>
                        <td
                          style={{ border: "1px solid #ccc", padding: "8px" }}
                        >
                          {ingredient.item}
                        </td>
                        <td
                          style={{ border: "1px solid #ccc", padding: "8px" }}
                        >
                          {ingredient.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </Box>
        </Box>
      </Container>
    </CssVarsProvider>
  );
}

export default App;
