// --- Navigation & State ---
export type ViewState = 'search' | 'chef' | 'history' | 'shopping' | 'auth';

export type ShoppingItem = {
  id: string;
  name: string;
  checked: boolean;
};

export type SavedSearch = {
  id: string;
  query: string;
  date: Date;
};

export type UserProfile = {
  name: string;
  dietaryPreferences: DietaryFilters;
  favorites: string[];
};

// --- Filters & Settings ---
export type DietaryFilters = {
  vegetarian: boolean;
  vegan: boolean;
  keto: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  lowCarb: boolean;
  highProtein?: boolean; // Required by App.tsx
  cuisine: string[];
  maxPrepTime: string | 'any';
};

// --- Languages ---
// Added 'sk' to fix translation errors
export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'sk';

// --- Recipe Data ---
export interface Ingredient {
  name: string;
  quantity: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  
  // Optional Nutrition
  fiber?: string;       // Required by App.tsx
  sugar?: string;
  sodium?: string;
  cholesterol?: string;
  potassium?: string;
  vitaminA?: string;
  vitaminC?: string;
  calcium?: string;
  iron?: string;
  
  // Metadata
  difficulty?: string;
  dietaryTags?: string[];
  tips?: string[];
  sourceUrl?: string;
  sourceName?: string;
  
  // Image handling (Aliases to prevent crashes)
  imageKeyword?: string;
  image?: string;
  imageUrl?: string;    // Required by RecipeCard.tsx & QuickViewModal.tsx
  userImages?: string[]; // Required by RecipeCard.tsx
  
  // App Logic
  missingIngredients?: Ingredient[]; // Required by RecipeCard.tsx
  cooked?: boolean;     // Required by RecipeCard.tsx
}
