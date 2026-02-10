// --- Navigation & State ---
// Combined list of ALL possible screens used in App.tsx
export type ViewState = 
  | 'search' | 'chef' | 'history' | 'shopping' | 'auth' 
  | 'home' | 'recipes' | 'chat' | 'recipe-details' | 'cooking';

export type ShoppingItem = {
  id: string;
  name: string;
  checked: boolean;
};

export type SavedSearch = {
  id: string;
  query: string;
  date: Date;
  filters?: DietaryFilters; // Added to fix build error
};

export type UserProfile = {
  name: string;
  dietaryPreferences: DietaryFilters;
  favorites: string[];
  secretKey?: string; // Added to fix build error
};

// --- Filters & Settings ---
export type DietaryFilters = {
  vegetarian: boolean;
  vegan: boolean;
  keto: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  lowCarb: boolean;
  highProtein?: boolean; // Added to fix build error
  lowFat?: boolean;      // Added to fix build error
  cuisine: string[];
  maxPrepTime: string | 'any';
};

// --- Languages ---
// REMOVED 'pt' (Portuguese) to fix build error
// KEPT 'sk' (Slovak) as requested
export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'sk';

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
  
  // Optional Nutrition (Added 'fiber' to fix build error)
  fiber?: string;       
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
  
  // Image handling
  imageKeyword?: string;
  image?: string;
  imageUrl?: string;    
  userImages?: string[]; 
  
  // App Logic
  missingIngredients?: Ingredient[];
  cooked?: boolean;     
}
