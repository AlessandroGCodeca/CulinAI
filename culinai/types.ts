export type DietaryFilters = {
  vegetarian: boolean;
  vegan: boolean;
  keto: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  lowCarb: boolean;
  cuisine: string[];
  maxPrepTime: string | 'any';
};

export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt';

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
  sugar?: string;
  sodium?: string;
  cholesterol?: string;
  potassium?: string;
  vitaminA?: string;
  vitaminC?: string;
  calcium?: string;
  iron?: string;
  difficulty?: string;
  dietaryTags?: string[];
  tips?: string[];
  sourceUrl?: string;
  sourceName?: string;
  imageKeyword?: string;
  image?: string; // Added this field
}
