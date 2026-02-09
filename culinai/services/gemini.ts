import { GoogleGenerativeAI } from "@google/generative-ai";
import { Recipe, DietaryFilters, Language } from "../types";

// Setup API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// UPDATED: Use the models confirmed in your JSON list
const MODELS_TO_TRY = ["gemini-2.0-flash", "gemini-2.5-flash"];

// --- SMART HELPER: Tries models one by one until one works ---
async function generateWithFallback(prompt: string | any[], systemInstruction?: string): Promise<string> {
  let lastError;
  
  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`Attempting with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: systemInstruction,
        generationConfig: { responseMimeType: "application/json" }
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (text) return text; // Success!
    } catch (error: any) {
      console.warn(`Model ${modelName} failed:`, error.message);
      lastError = error;
      // If error is NOT a 404 (Not Found), it might be a real issue (like quota), so we stop.
      // But for 404s, we continue to the next model.
      if (!error.message.includes("404") && !error.message.includes("not found")) {
         // Continue anyway to be safe
      }
    }
  }
  throw new Error(`All models failed. Last error: ${lastError?.message}`);
}

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeFridgeImage = async (base64Images: string[], language: Language = 'en'): Promise<string[]> => {
  try {
    const imageParts = base64Images.map(base64 => ({
      inlineData: {
        data: base64,
        mimeType: "image/jpeg",
      },
    }));

    const prompt = `Analyze these images of a fridge, pantry, spices, and other food items. Identify all visible ingredients from all images. Combine them into a single deduplicated list. 
      IMPORTANT: Return the ingredient names strictly in the ${language} language.
      Return strictly a JSON array of strings containing the names of the ingredients found. Do not include Markdown formatting.`;

    const text = await generateWithFallback([prompt, ...imageParts]);
    const cleanText = text.replace(/```json\n?|```/g, '');
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error analyzing image:", error);
    alert("AI Scan Error: " + error);
    return [];
  }
};

export const searchRecipes = async (ingredients: string[], filters: DietaryFilters, language: Language = 'en'): Promise<Recipe[]> => {
  const activeFilters = Object.entries(filters)
    .filter(([key, isActive]) => key !== 'cuisine' && key !== 'maxPrepTime' && isActive)
    .map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase())
    .join(", ");

  const cuisineText = filters.cuisine && filters.cuisine.length > 0 
    ? `Strictly restrict results to these cuisines: ${filters.cuisine.join(", ")}.`
    : "";

  const timeText = filters.maxPrepTime && filters.maxPrepTime !== 'any'
    ? `Strictly restrict recipes to have a total prep+cook time of under ${filters.maxPrepTime} minutes.`
    : "";

  const prompt = `
    I have these ingredients: ${ingredients.join(", ")}.
    ${activeFilters ? `I have these dietary restrictions: ${activeFilters}.` : ""}
    ${cuisineText}
    ${timeText}
    
    Please suggest 4 distinct recipes that I can make or almost make.
    IMPORTANT: Provide the response strictly in the ${language} language.
    
    For each recipe, compare my ingredients with the recipe requirements and list any essential "missingIngredients".
    
    Return the result strictly as a JSON list of objects matching this structure:
    [
      {
        "id": "unique_id",
        "title": "Recipe Title",
        "description": "Short appetizing description",
        "sourceUrl": "The URL of the recipe source (e.g. https://www.allrecipes.com/...)",
        "sourceName": "The name of the website source (e.g. AllRecipes)",
        "ingredients": [{"name": "ingredient name", "quantity": "amount (e.g. 2 cups)"}],
        "missingIngredients": [{"name": "ingredient name", "quantity": "amount"}],
        "instructions": ["Step 1...", "Step 2..."],
        "prepTime": "e.g. 30 mins",
        "calories": "e.g. 500 kcal",
        "protein": "e.g. 30g",
        "carbs": "e.g. 45g",
        "fat": "e.g. 15g",
        "fiber": "e.g. 5g",
        "sugar": "e.g. 10g",
        "sodium": "e.g. 500mg",
        "cholesterol": "e.g. 30mg",
        "potassium": "e.g. 400mg",
        "vitaminA": "e.g. 10% DV",
        "vitaminC": "e.g. 15% DV",
        "calcium": "e.g. 20% DV",
        "iron": "e.g. 5% DV",
        "difficulty": "Easy" | "Medium" | "Hard",
        "dietaryTags": ["Vegetarian", "Keto", etc],
        "tips": ["Tip 1", "Tip 2"]
      }
    ]
  `;

  try {
    const text = await generateWithFallback(prompt);
    const cleanText = text.replace(/```json\n?|```/g, '');
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error finding recipes:", error);
    alert("Recipe Error: " + error);
    return [];
  }
};

export const searchRecipesByQuery = async (query: string, filters: DietaryFilters, language: Language = 'en'): Promise<Recipe[]> => {
  const activeFilters = Object.entries(filters)
    .filter(([key, isActive]) => key !== 'cuisine' && key !== 'maxPrepTime' && isActive)
    .map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase())
    .join(", ");

  const cuisineText = filters.cuisine && filters.cuisine.length > 0 
    ? `Strictly restrict results to these cuisines: ${filters.cuisine.join(", ")}.`
    : "";

  const timeText = filters.maxPrepTime && filters.maxPrepTime !== 'any'
    ? `Strictly restrict recipes to have a total prep+cook time of under ${filters.maxPrepTime} minutes.`
    : "";

  const prompt = `
    Act as a smart culinary assistant. The user is asking: "${query}".
    
    Interpret the intent of this query, looking for:
    - Ingredients (e.g. "chicken", "broccoli")
    - Dietary preferences (e.g. "low carb", "keto")
    - Time constraints (e.g. "under 30 mins")
    - Meal types (e.g. "dinner", "snack")
    
    ${activeFilters ? `Also apply these checkbox filters from the app: ${activeFilters}.` : ""}
    ${cuisineText}
    ${timeText}
    
    Use Google Search (simulated) to find 4 high-quality, real recipes that best match these criteria. Include specific quantities for ingredients.
    IMPORTANT: Provide the response strictly in the ${language} language.
    
    Return the result strictly as a JSON list of objects matching this structure:
    [
      {
        "id": "unique_id",
        "title": "Recipe Title",
        "description": "Short appetizing description",
        "sourceUrl": "The URL of the recipe source (e.g. https://www.allrecipes.com/...)",
        "sourceName": "The name of the website source (e.g. AllRecipes)",
        "ingredients": [{"name": "ingredient name", "quantity": "amount (e.g. 2 cups)"}],
        "missingIngredients": [{"name": "ingredient name", "quantity": "amount"}], 
        "instructions": ["Step 1...", "Step 2..."],
        "prepTime": "e.g. 30 mins",
        "calories": "e.g. 500 kcal",
        "protein": "e.g. 30g",
        "carbs": "e.g. 45g",
        "fat": "e.g. 15g",
        "fiber": "e.g. 5g",
        "sugar": "e.g. 10g",
        "sodium": "e.g. 500mg",
        "cholesterol": "e.g. 30mg",
        "potassium": "e.g. 400mg",
        "vitaminA": "e.g. 10% DV",
        "vitaminC": "e.g. 15% DV",
        "calcium": "e.g. 20% DV",
        "iron": "e.g. 5% DV",
        "difficulty": "Easy" | "Medium" | "Hard",
        "dietaryTags": ["Vegetarian", "Keto", etc],
        "tips": ["Tip 1", "Tip 2"]
      }
    ]
  `;

  try {
    const text = await generateWithFallback(prompt);
    const cleanText = text.replace(/```json\n?|```/g, '');
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error searching recipes:", error);
    alert("Search Error: " + error);
    return [];
  }
};

export const getChefTips = async (recipeTitle: string, ingredients: string[], language: Language = 'en'): Promise<string[]> => {
    const prompt = `
    Provide 3 professional, concise chef's tips for making "${recipeTitle}". 
    Focus on technique, flavor enhancement, or avoiding common pitfalls. 
    Context: Ingredients include ${ingredients.join(', ')}.
    
    IMPORTANT: Provide the tips strictly in the ${language} language.
    Return strictly a JSON array of strings. Do not use Markdown.
    Example: ["Sear the meat at high heat.", "Use fresh herbs for garnish."]
    `;
    
    try {
        const text = await generateWithFallback(prompt);
        return JSON.parse(text);
    } catch (error) {
        console.error("Error fetching tips:", error);
        return [];
    }
};

// Disabled functions
export const generateSpeech = async (_text: string): Promise<ArrayBuffer | null> => {
    return null; 
};

export const generateRecipeImage = async (_title: string, _size: '1K' | '2K' | '4K' = '1K'): Promise<string | null> => {
    return null; 
};

export const createChefChat = (language: Language = 'en') => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash", 
    systemInstruction: `You are CulinAI, a world-class chef and culinary assistant. Help users with cooking tips, substitutions, and techniques. Be concise and encouraging. IMPORTANT: You must reply in the ${language} language.`
  });
  return model.startChat();
};
