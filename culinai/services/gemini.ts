import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Recipe, DietaryFilters, Language } from "../types";

// FIX 1: Updated to use Vite environment variable
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
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
      model: 'gemini-2.0-flash',
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
    Use Google Search to find real, popular recipes to ensure accuracy of steps, ingredient quantities, and calorie counts.
    
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
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return [];
    const cleanText = text.replace(/```json\n?|```/g, '');
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error finding recipes:", error);
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
    
    Use Google Search to find 4 high-quality, real recipes that best match these criteria. Include specific quantities for ingredients.
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return [];
    const cleanText = text.replace(/```json\n?|```/g, '');
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error searching recipes:", error);
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
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
            }
        });
        
        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);
    } catch (error) {
        console.error("Error fetching tips:", error);
        return [];
    }
};

export const generateSpeech = async (text: string): Promise<ArrayBuffer | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Use flash for TTS as it's faster
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    // Convert base64 to ArrayBuffer
    const binaryString = window.atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export const generateRecipeImage = async (title: string, size: '1K' | '2K' | '4K' = '1K'): Promise<string | null> => {
  try {
    // FIX 2: Updated to use Vite environment variable
    const freshAi = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const response = await freshAi.models.generateContent({
      model: 'imagen-3.0-generate-002', // Using Imagen 3
      contents: {
        parts: [
          {
            text: `A professional, appetizing food photography shot of ${title}. High resolution, studio lighting, photorealistic.`
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "4:3",
          // @ts-ignore
          imageSize: size
        },
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
};

export const createChefChat = (language: Language = 'en') => {
  // FIX 3: Updated to use Vite environment variable
  const freshAi = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  return freshAi.chats.create({
    model: 'gemini-2.0-flash',
    config: {
      systemInstruction: `You are CulinAI, a world-class chef and culinary assistant. Help users with cooking tips, substitutions, and techniques. Be concise and encouraging. IMPORTANT: You must reply in the ${language} language.`
    }
  });
};
