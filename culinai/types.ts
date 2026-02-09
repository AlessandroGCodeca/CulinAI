
export interface Ingredient {
  name: string;
  category?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface RecipeIngredient {
  name: string;
  quantity: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: RecipeIngredient[];
  missingIngredients: RecipeIngredient[];
  instructions: string[];
  prepTime: string;
  calories: string;
  protein?: string;
  carbs?: string;
  fat?: string;
  fiber?: string;
  sugar?: string;
  sodium?: string;
  cholesterol?: string;
  potassium?: string;
  vitaminA?: string;
  vitaminC?: string;
  calcium?: string;
  iron?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  dietaryTags: string[];
  tips?: string[]; // Chef's tips and tricks
  imageUrl?: string; // Optional, if we can extract one or use a placeholder
  userImages?: string[]; // User uploaded images (max 5)
  cooked?: boolean;
  sourceUrl?: string;
  sourceName?: string;
}

export interface DietaryFilters {
  vegetarian: boolean;
  vegan: boolean;
  keto: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  lowCarb: boolean;
  highProtein: boolean;
  lowFat: boolean;
  cuisine: string[];
  maxPrepTime?: string;
}

export interface SavedSearch {
  id: string;
  query: string;
  filters: DietaryFilters;
  timestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface UserProfile {
  name: string;
  secretKey: string;
}

export type ViewState = 'home' | 'recipes' | 'recipe-details' | 'cooking' | 'shopping' | 'history' | 'chat';

export type Language = 'en' | 'sk' | 'it' | 'de' | 'es' | 'fr';