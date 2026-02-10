import { GoogleGenerativeAI } from "@google/generative-ai";
import { Recipe, DietaryFilters, Language } from "../types";

// Setup API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Text Models
const TEXT_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash"];

// --- SMART HELPER ---
async function generateWithFallback(prompt: string | any[], systemInstruction?: string): Promise<string> {
  let lastError;
  for (const modelName of TEXT_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: systemInstruction,
        generationConfig: { responseMimeType: "application/json" }
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (text) return text; 
    } catch (error: any) {
      console.warn(`Model ${modelName} failed:`, error.message);
      lastError = error;
      if (!error.message.includes("404") && !error.message.includes("not found")) {
         // Continue to be safe
      }
    }
  }
  throw new Error(`All models failed. Last error: ${lastError?.message}`);
}

const safeJsonParse = (text: string) => {
  try {
    let cleanText = text.replace(/```json\n?|```/g, '').trim();
    if (!cleanText.endsWith(']') && cleanText.startsWith('[')) {
        cleanText += ']';
    }
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return []; 
  }
};

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

// --- ROBUST IMAGE GENERATOR (Now Backward Compatible) ---
// Accepts 'size' but ignores it to prevent build errors
export const generateRecipeImage = async (keyword: string, _size?: string): Promise<string | null> => {
    try {
        // Use Bing's Thumbnail API for reliable, instant, relevant food images
        // We add "food" to ensure we don't get random objects
        const query = encodeURIComponent(`${keyword} food dish`);
        return `https://tse2.mm.bing.net/th?q=${query}&w=800&h=600&c=7&rs=1&p=0`;
    } catch (error) {
        return null;
    }
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
    return safeJsonParse(text);
  } catch (error) {
    console.error("Error analyzing image:", error);
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
    
    CRITICAL: For each recipe, include a hidden field "imageKeyword" which is a SINGLE english word to describe the dish (e.g. "Pasta", "Pizza", "Soup", "Chicken") for finding a stock photo.
    
    Return the result strictly as a JSON list of objects matching this structure:
    [
      {
        "id": "unique_id",
        "title": "Recipe Title",
        "description": "Short appetizing description",
        "sourceUrl": "The URL of the recipe source",
        "sourceName": "The name of the website source",
        "imageKeyword": "OneWordTag",
        "ingredients": [{"name": "ingredient name", "quantity": "amount"}],
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
    const recipes = safeJsonParse(text);

    // AUTO-IMAGE: Use the AI-provided simple keyword
    const recipesWithImages = await Promise.all(recipes.map(async (recipe: any) => {
      // Fallback to title if AI missed the keyword
      const keyword = recipe.imageKeyword || recipe.title.split(" ")[0];
      const imageUrl = await generateRecipeImage(keyword);
      return { ...recipe, image: imageUrl };
    }));

    return recipesWithImages;
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
    
    CRITICAL: For each recipe, include a hidden field "imageKeyword" which is a SINGLE english word to describe the dish (e.g. "Pasta", "Pizza", "Soup", "Chicken") for finding a stock photo.
    
    Return the result strictly as a JSON list of objects matching this structure:
    [
      {
        "id": "unique_id",
        "title": "Recipe Title",
        "description": "Short appetizing description",
        "sourceUrl": "The URL of the recipe source",
        "sourceName": "The name of the website source",
        "imageKeyword": "OneWordTag",
        "ingredients": [{"name": "ingredient name", "quantity": "amount"}],
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
    const recipes = safeJsonParse(text);

    // AUTO-IMAGE: Use the AI-provided simple keyword
    const recipesWithImages = await Promise.all(recipes.map(async (recipe: any) => {
      // Fallback to title if AI missed the keyword
      const keyword = recipe.imageKeyword || recipe.title.split(" ")[0];
      const imageUrl = await generateRecipeImage(keyword);
      return { ...recipe, image: imageUrl };
    }));

    return recipesWithImages;
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
        return safeJsonParse(text);
    } catch (error) {
        console.error("Error fetching tips:", error);
        return [];
    }
};

export const generateSpeech = async (_text: string): Promise<ArrayBuffer | null> => {
    return null; 
};

export const createChefChat = (language: Language = 'en') => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash", 
    systemInstruction: `You are CulinAI, a world-class chef and culinary assistant. Help users with cooking tips, substitutions, and techniques. Be concise and encouraging. IMPORTANT: You must reply in the ${language} language.`
  });
  return model.startChat();
};
