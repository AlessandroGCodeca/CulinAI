
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, DietaryFilters, Language } from "../types";

// Setup API - Stable Version
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

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
    const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = base64Images.map(base64 => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64
      }
    }));

    parts.push({
      text: `Analyze these images of a fridge, pantry, spices, and other food items. Identify all visible ingredients from all images. Combine them into a single deduplicated list. 
      IMPORTANT: Return the ingredient names strictly in the ${language} language.
      Return strictly a JSON array of strings containing the names of the ingredients found. Do not include Markdown formatting.`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: {
        parts: parts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
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
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return [];
    const cleanText = text.replace(/```json\n?|```/g, '');
