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

// --- IMPROVED IMAGE GENERATOR ---
export const generateRecipeImage = async (query: string, _ignored?: any): Promise<string | null> => {
    try {
        // Clean the query to get better results
        // Remove common filler words to focus on the dish name
        const cleanQuery = query
          .replace(/recipe|easy|best|authentic|homemade|quick/gi, '')
          .trim();
          
        const encodedQuery = encodeURIComponent(`${cleanQuery} food plated high quality`);
        
        // Use Bing's Thumbnail API
        // We add a random parameter to the URL to prevent caching if we search the same thing twice
        return `https://tse2.mm.bing.net/th?q=${encodedQuery}&w=800&h=600&c=7&rs=1&p=0&dpr=2&pid=1.7&mkt=en-US&adlt=moderate`;
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
  // Pass to the main search function to keep logic consistent
  // Join ingredients with commas to make a query string
  return searchRecipesByQuery(ingredients.join(", "), filters, language);
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
    
    Interpret the intent:
    - If it's a specific dish (e.g. "Carbonara"), provide 4 DISTINCT variations of that specific dish (e.g. Classic, Creamy, Vegetarian, Modern).
    - If it's ingredients (e.g. "Chicken, Rice"), provide 4 DISTINCT recipes using them.
    
    ${activeFilters ? `Apply these dietary filters strictly: ${activeFilters}.` : ""}
    ${cuisineText}
    ${timeText}
    
    IMPORTANT: Provide the response strictly in the ${language} language.
    
    Return the result strictly as a JSON list of objects matching this structure:
    [
      {
        "id": "unique_id",
        "title": "Recipe Title",
        "description": "Short appetizing description",
        "sourceUrl": "The URL of the recipe source",
        "sourceName": "The name of the website source",
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

    // AUTO-IMAGE FIX: Use the specific title for unique images
    const recipesWithImages = await Promise.all(recipes.map(async (recipe: any) => {
      // Use the full title (minus common words) to get a specific image
      // e.g. "Classic Spaghetti Carbonara" -> finds a carbonara image, not just "pasta"
      const imageUrl = await generateRecipeImage(recipe.title);
      return { 
          ...recipe, 
          image: imageUrl,           
          imageUrl: imageUrl,        
          userImages: [] // FIX: Keep this empty so the "User Photo" badge doesn't appear
      };
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
    IMPORTANT: Provide the tips strictly in the ${language} language.
    Return strictly a JSON array of strings.
    `;
    try {
        const text = await generateWithFallback(prompt);
        return safeJsonParse(text);
    } catch (error) {
        return [];
    }
};

export const createChefChat = (language: Language = 'en') => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash", 
    systemInstruction: `You are CulinAI, a world-class chef. Help users with cooking tips. Be concise. Reply in ${language}.`
  });
  return model.startChat();
};

export const generateSpeech = async (_text: string): Promise<ArrayBuffer | null> => { return null; };
