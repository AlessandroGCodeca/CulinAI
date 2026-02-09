import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { RecipeCard } from './components/RecipeCard';
import { CookingMode } from './components/CookingMode';
import { ShoppingList } from './components/ShoppingList';
import { RecipeDetails } from './components/RecipeDetails';
import { ChatBot } from './components/ChatBot';
import { QuickViewModal } from './components/QuickViewModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthScreen } from './components/AuthScreen';
import { analyzeFridgeImage, searchRecipes, searchRecipesByQuery, fileToGenerativePart } from './services/gemini';
import { Recipe, DietaryFilters, ViewState, ShoppingItem, SavedSearch, Language, UserProfile } from './types';
import { TRANSLATIONS } from './constants/translations';
import { Camera, Loader2, RefreshCw, History, Search, ArrowDownUp, Menu, Home, MessageSquare, ShoppingCart, Bookmark, X, ChefHat, Filter, ScanLine, Zap, Leaf, Coffee, Utensils, Sparkles, Clock, Plus, Trash2, ImagePlus } from 'lucide-react';

const POPULAR_TERMS = [
  "Chicken", "Beef", "Pasta", "Rice", "Salad", "Soup", "Curry", "Tacos", 
  "Pizza", "Burger", "Sandwich", "Stir Fry", "Salmon", "Shrimp", "Eggs",
  "Breakfast", "Lunch", "Dinner", "Dessert", "Smoothie", "Pancakes",
  "Spaghetti Carbonara", "Chicken Parmesan", "Beef Stew", "Caesar Salad",
  "Vegetarian Lasagna", "Vegan Chili", "Mushroom Risotto", "Guacamole",
  "Chocolate Chip Cookies", "French Toast", "Pad Thai", "Ramen", "Avocado Toast",
  "Grilled Cheese", "Tomato Soup", "Steak", "Roast Chicken", "Tuna Salad"
];

const POPULAR_CUISINES = [
    "Italian", "Mexican", "Indian", "Chinese", "Thai", 
    "Japanese", "Mediterranean", "American", "French",
    "Greek", "Korean", "Spanish", "Vietnamese", "Middle Eastern"
];

const MOOD_COLLECTIONS = [
    { id: 'quick', title: "Quick & Easy", subtitle: "Ready in 30 mins", icon: Zap, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", border: "hover:border-amber-200 dark:hover:border-amber-800", search: "quick and easy recipes under 30 minutes" },
    { id: 'healthy', title: "Healthy Living", subtitle: "Fresh & light", icon: Leaf, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "hover:border-emerald-200 dark:hover:border-emerald-800", search: "healthy nutritious light recipes" },
    { id: 'comfort', title: "Comfort Food", subtitle: "Cozy & hearty", icon: Utensils, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-900/20", border: "hover:border-rose-200 dark:hover:border-rose-800", search: "comfort food dinner recipes" },
    { id: 'breakfast', title: "Rise & Shine", subtitle: "Breakfast ideas", icon: Coffee, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", border: "hover:border-blue-200 dark:hover:border-blue-800", search: "creative breakfast and brunch recipes" },
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [cookedRecipes, setCookedRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  const [chatInitialMessage, setChatInitialMessage] = useState('');
  
  // Image handling state
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [quickViewRecipe, setQuickViewRecipe] = useState<Recipe | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sortBy, setSortBy] = useState<string>('default');
  
  // Global Settings State
  const [language, setLanguage] = useState<Language>('en');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const t = TRANSLATIONS[language]; // Current translation helper

  const [filters, setFilters] = useState<DietaryFilters>({
    vegetarian: false,
    vegan: false,
    keto: false,
    glutenFree: false,
    dairyFree: false,
    lowCarb: false,
    highProtein: false,
    lowFat: false,
    cuisine: [],
    maxPrepTime: 'any'
  });

  // Load persistence
  useEffect(() => {
    // Auth Check
    const storedUser = localStorage.getItem('culinai_user_profile');
    if (storedUser) {
        try {
            const profile = JSON.parse(storedUser);
            setUserProfile(profile);
            
            // Check for secret link query param
            const params = new URLSearchParams(window.location.search);
            const secretLinkKey = params.get('key');
            
            // Auto login if key matches OR session is active
            const sessionActive = localStorage.getItem('culinai_session_active') === 'true';
            
            if (secretLinkKey === profile.secretKey) {
                setIsAuthenticated(true);
                localStorage.setItem('culinai_session_active', 'true');
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            } else if (sessionActive) {
                setIsAuthenticated(true);
            }
        } catch (e) {
            console.error("Auth load error", e);
        }
    }

    const savedFilters = localStorage.getItem('culinai_filters');
    if (savedFilters) {
      try {
        setFilters(prev => ({...prev, ...JSON.parse(savedFilters)}));
      } catch (e) {
        console.error("Failed to parse saved filters", e);
      }
    }

    const storedSearches = localStorage.getItem('culinai_saved_searches');
    if (storedSearches) {
        try {
            setSavedSearches(JSON.parse(storedSearches));
        } catch (e) {
            console.error("Failed to parse saved searches", e);
        }
    }

    // Load theme
    const savedTheme = localStorage.getItem('culinai_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setIsDarkMode(true);
    }
    
    // Load language
    const savedLang = localStorage.getItem('culinai_language') as Language;
    if (savedLang) {
        setLanguage(savedLang);
    }
  }, []);

  // Apply theme side effects
  useEffect(() => {
      const root = window.document.documentElement;
      if (isDarkMode) {
          root.classList.add('dark');
          localStorage.setItem('culinai_theme', 'dark');
      } else {
          root.classList.remove('dark');
          localStorage.setItem('culinai_theme', 'light');
      }
  }, [isDarkMode]);

  // Persist language
  useEffect(() => {
      localStorage.setItem('culinai_language', language);
  }, [language]);

  const handleRegister = (profile: UserProfile) => {
      setUserProfile(profile);
      setIsAuthenticated(true);
      localStorage.setItem('culinai_user_profile', JSON.stringify(profile));
      localStorage.setItem('culinai_session_active', 'true');
  };

  const handleLogin = (key: string) => {
      if (userProfile && key === userProfile.secretKey) {
          setIsAuthenticated(true);
          localStorage.setItem('culinai_session_active', 'true');
      }
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      localStorage.removeItem('culinai_session_active');
  };

  const handleFilterChange = (key: keyof DietaryFilters) => {
    if (key === 'cuisine' || key === 'maxPrepTime') return;
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCuisineChange = (cuisine: string) => {
    setFilters(prev => {
        const current = prev.cuisine || [];
        if (current.includes(cuisine)) {
            return { ...prev, cuisine: current.filter(c => c !== cuisine) };
        } else {
            return { ...prev, cuisine: [...current, cuisine] };
        }
    });
  };

  const handlePrepTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const time = e.target.value;
      const newFilters = { ...filters, maxPrepTime: time };
      setFilters(newFilters);
      
      // Trigger new search with updated filter
      if (ingredients.length > 0) {
          findRecipes(ingredients, newFilters);
      } else if (searchQuery) {
          performSearch(searchQuery, newFilters);
      }
  };

  const handleSaveFilters = () => {
    localStorage.setItem('culinai_filters', JSON.stringify(filters));
  };

  const handleSaveSearch = () => {
    if (!searchQuery.trim()) return;
    
    const exists = savedSearches.some(s => s.query.toLowerCase() === searchQuery.trim().toLowerCase());
    if (exists) return;

    const newSearch: SavedSearch = {
        id: Date.now().toString(),
        query: searchQuery.trim(),
        filters: { ...filters }, 
        timestamp: Date.now()
    };

    const updatedSearches = [newSearch, ...savedSearches];
    setSavedSearches(updatedSearches);
    localStorage.setItem('culinai_saved_searches', JSON.stringify(updatedSearches));
  };

  const handleDeleteSearch = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updatedSearches = savedSearches.filter(s => s.id !== id);
      setSavedSearches(updatedSearches);
      localStorage.setItem('culinai_saved_searches', JSON.stringify(updatedSearches));
  };

  const handleApplySavedSearch = (savedSearch: SavedSearch) => {
      setSearchQuery(savedSearch.query);
      setFilters(savedSearch.filters);
      performSearch(savedSearch.query, savedSearch.filters);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const remainingSlots = 5 - uploadedImages.length;
      
      if (remainingSlots <= 0) {
          alert("Maximum 5 photos allowed. Please remove some to add more.");
          return;
      }

      const filesToProcess = files.slice(0, remainingSlots);
      
      setIsProcessingImages(true);
      
      try {
        const newImages = await Promise.all(filesToProcess.map(fileToGenerativePart));
        setUploadedImages(prev => [...prev, ...newImages]);
      } catch (error) {
        console.error("Image processing failed", error);
        alert("Something went wrong processing the images.");
      } finally {
        setIsProcessingImages(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const triggerCamera = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleAnalyzeImages = async () => {
      if (uploadedImages.length === 0) return;
      
      setIsAnalyzing(true);
      try {
          const detectedIngredients = await analyzeFridgeImage(uploadedImages, language);
          setIngredients(detectedIngredients);
          if (detectedIngredients.length > 0) {
              setUploadedImages([]); // Clear images after successful analysis
              await findRecipes(detectedIngredients);
          } else {
              alert("No ingredients detected. Please try clearer photos.");
          }
      } catch (error) {
          console.error("Analysis failed", error);
          alert("Something went wrong analyzing the images.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const performSearch = async (query: string, overrideFilters?: DietaryFilters) => {
    if (!query.trim()) return;
    setSearchQuery(query);
    setShowSuggestions(false);
    setIsSearching(true);
    setView('recipes');
    if (!overrideFilters && ingredients.length === 0) {
        // Only clear ingredients if this is a brand new manual search not triggered by a filter change on an ingredient search
        setIngredients([]);
    }
    
    const filtersToUse = overrideFilters || filters;

    try {
      const foundRecipes = await searchRecipesByQuery(query, filtersToUse, language);
      setRecipes(foundRecipes);
    } catch (error) {
      console.error("Manual search failed", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      
      if (value.length > 0) {
          const filtered = POPULAR_TERMS.filter(term => 
              term.toLowerCase().includes(value.toLowerCase())
          ).slice(0, 5);
          setSuggestions(filtered);
          setShowSuggestions(true);
      } else {
          setShowSuggestions(false);
      }
  };

  const handleSuggestionClick = (term: string) => {
      performSearch(term);
  };

  const findRecipes = async (items: string[], overrideFilters?: DietaryFilters) => {
    setIsSearching(true);
    setView('recipes');
    const filtersToUse = overrideFilters || filters;
    try {
      const foundRecipes = await searchRecipes(items, filtersToUse, language);
      setRecipes(foundRecipes);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsSearching(false);
    }
  };

  const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

  const addToShoppingList = (items: string[]) => {
    const newItems: ShoppingItem[] = items.map(name => ({
      id: generateId(),
      name,
      checked: false
    }));
    setShoppingList(prev => [...prev, ...newItems]);
  };

  const removeFromShoppingList = (id: string) => {
    setShoppingList(prev => prev.filter(item => item.id !== id));
  };
  
  const addSingleItem = (item: string) => {
      setShoppingList(prev => [...prev, {
        id: generateId(),
        name: item,
        checked: false
      }]);
  }

  const toggleShoppingItem = (id: string) => {
    setShoppingList(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const updateRecipeImage = (id: string, imageUrl: string) => {
    const updater = (list: Recipe[]) => list.map(recipe => 
      recipe.id === id ? { ...recipe, imageUrl } : recipe
    );

    setRecipes(prev => updater(prev));
    setCookedRecipes(prev => updater(prev));
    
    if (selectedRecipe?.id === id) {
      setSelectedRecipe(prev => prev ? { ...prev, imageUrl } : null);
    }
  };

  const addUserImages = (id: string, images: string[]) => {
      const updater = (list: Recipe[]) => list.map(recipe => 
        recipe.id === id ? { ...recipe, userImages: images } : recipe
      );

      setRecipes(prev => updater(prev));
      setCookedRecipes(prev => updater(prev));
      
      if (selectedRecipe?.id === id) {
        setSelectedRecipe(prev => prev ? { ...prev, userImages: images } : null);
      }
  };

  const handleFinishCooking = () => {
    if (selectedRecipe) {
      const cookedRecipe = { ...selectedRecipe, cooked: true };
      
      setCookedRecipes(prev => {
        const others = prev.filter(r => r.id !== cookedRecipe.id);
        return [cookedRecipe, ...others];
      });

      setRecipes(prev => prev.map(r => 
        r.id === cookedRecipe.id ? { ...r, cooked: true } : r
      ));

      setView('history');
    }
  };

  const handleAskChef = (query: string) => {
    setChatInitialMessage(query);
    setView('chat');
  };

  const getSortedRecipes = () => {
    const list = [...recipes];
    
    const getNutrientValue = (str: string | undefined, defaultValue: number) => {
        if (!str) return defaultValue;
        const m = str.match(/(\d+(\.\d+)?)/);
        return m ? parseFloat(m[0]) : defaultValue;
    };

    switch (sortBy) {
      case 'time':
        return list.sort((a, b) => {
           const getMins = (str: string) => {
             const m = str.match(/(\d+)/);
             return m ? parseInt(m[0]) : 999;
           };
           return getMins(a.prepTime) - getMins(b.prepTime);
        });
      case 'difficulty':
        const map: Record<string, number> = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        return list.sort((a, b) => (map[a.difficulty] || 2) - (map[b.difficulty] || 2));
      case 'calories':
        return list.sort((a, b) => getNutrientValue(a.calories, 9999) - getNutrientValue(b.calories, 9999));
      case 'protein-high':
        return list.sort((a, b) => getNutrientValue(b.protein, 0) - getNutrientValue(a.protein, 0));
      case 'carbs-low':
        return list.sort((a, b) => getNutrientValue(a.carbs, 9999) - getNutrientValue(b.carbs, 9999));
      case 'fiber-high':
        return list.sort((a, b) => getNutrientValue(b.fiber, 0) - getNutrientValue(a.fiber, 0));
      default:
        return list;
    }
  };

  const sortedRecipes = getSortedRecipes();

  // AUTH WALL
  if (!isAuthenticated) {
      return (
          <div className={`flex h-[100dvh] bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden relative ${isDarkMode ? 'dark' : ''}`}>
              <AuthScreen 
                language={language}
                onRegister={handleRegister}
                onLogin={handleLogin}
                existingProfile={userProfile}
              />
          </div>
      );
  }

  const MobileHeader = () => (
    <div className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 px-5 py-4 flex flex-col z-30 sticky top-0 transition-all shadow-sm">
        <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2.5">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 rounded-lg text-white shadow-lg shadow-emerald-500/20">
                    <ChefHat size={20} strokeWidth={2.5} />
                </div>
                <h1 className="font-extrabold text-xl text-slate-800 dark:text-white tracking-tight">CulinAI</h1>
            </div>
            <div className="flex gap-2">
                 <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2.5 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95 relative"
                >
                    <Menu size={22} className="text-slate-700 dark:text-slate-200" strokeWidth={2.5} />
                    {Object.entries(filters).some(([key, val]) => {
                        if (key === 'cuisine') {
                            return (val as string[]).length > 0;
                        }
                        if (key === 'maxPrepTime') {
                            return val !== 'any';
                        }
                        return !!val;
                    }) && (
                         <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
                    )}
                </button>
            </div>
        </div>
        
        {(view === 'home' || view === 'recipes') && (
            <div className="flex overflow-x-auto gap-2 py-3 no-scrollbar -mx-5 px-5 mask-fade-right">
                <div className="flex items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 shrink-0">
                    <Filter size={10} className="mr-1" /> Filters:
                </div>
                {Object.entries(filters).map(([key, isActive]) => {
                    if (key === 'cuisine') {
                        return (filters.cuisine || []).map(cuisine => (
                            <button
                                key={cuisine}
                                onClick={() => handleCuisineChange(cuisine)}
                                className="whitespace-nowrap px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all bg-emerald-500 text-white shadow-md shadow-emerald-500/20 active:scale-95"
                            >
                                {cuisine}
                            </button>
                        ));
                    }
                    if (key === 'maxPrepTime') {
                        if (isActive === 'any' || !isActive) return null;
                         return (
                            <button
                                key={key}
                                onClick={() => setFilters(prev => ({...prev, maxPrepTime: 'any'}))}
                                className="whitespace-nowrap px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all bg-emerald-500 text-white shadow-md shadow-emerald-500/20 active:scale-95 flex items-center gap-1"
                            >
                                <Clock size={10} /> {isActive} mins
                            </button>
                        );
                    }
                    if (!isActive) return null;
                    return (
                        <button
                            key={key}
                            onClick={() => handleFilterChange(key as keyof DietaryFilters)}
                            className="whitespace-nowrap px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all bg-emerald-500 text-white shadow-md shadow-emerald-500/20 active:scale-95"
                        >
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                        </button>
                    );
                })}
                 {Object.entries(filters).map(([key, isActive]) => {
                     if (key === 'cuisine' || key === 'maxPrepTime') return null;
                     if (isActive) return null; 
                     return (
                        <button
                            key={key}
                            onClick={() => handleFilterChange(key as keyof DietaryFilters)}
                            className="whitespace-nowrap px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:text-emerald-600 active:scale-95"
                        >
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                        </button>
                     )
                 })}
            </div>
        )}
    </div>
  );

  // Bottom Navigation Component
  const BottomNav = () => (
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100/80 dark:border-slate-800/80 flex justify-between items-center px-8 pb-6 pt-4 z-40 shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.05)]">
        {[
            { id: 'home', icon: Home, label: t.findRecipes, activeStates: ['home', 'recipes'] },
            { id: 'chat', icon: MessageSquare, label: t.chefAi, activeStates: ['chat'] },
            { id: 'shopping', icon: ShoppingCart, label: t.shoppingList, badge: shoppingList.filter(i => !i.checked).length, activeStates: ['shopping'] },
            { id: 'history', icon: History, label: t.cookedHistory, activeStates: ['history'] }
        ].map((item) => {
            const isActive = item.activeStates.includes(view);
            const Icon = item.icon;
            
            return (
                <button 
                    key={item.id}
                    onClick={() => setView(item.id as ViewState)} 
                    className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group outline-none ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'} active:scale-95`}
                >
                    <div className={`relative p-2.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-emerald-100/80 dark:bg-emerald-900/30 shadow-sm translate-y-0 scale-100' : 'translate-y-1 group-active:scale-90 bg-transparent'}`}>
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'} />
                        {item.badge ? (
                            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm font-bold animate-in zoom-in">
                                {item.badge}
                            </span>
                        ) : null}
                    </div>
                    {isActive && (
                        <span className="text-[10px] font-bold transition-all duration-300 animate-in fade-in slide-in-from-bottom-1 max-w-[60px] truncate">
                            {item.label}
                        </span>
                    )}
                </button>
            );
        })}
      </div>
  );

  return (
    <div className={`flex h-[100dvh] bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden relative selection:bg-emerald-100 dark:selection:bg-emerald-900 selection:text-emerald-900 dark:selection:text-emerald-100 ${isDarkMode ? 'dark' : ''}`}>
      
      {/* Premium Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-emerald-200/20 dark:bg-emerald-900/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse-slow"></div>
          <div className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] bg-teal-100/40 dark:bg-teal-900/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen"></div>
          <div className="absolute bottom-[-10%] left-[10%] w-[50%] h-[50%] bg-indigo-100/30 dark:bg-indigo-900/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen"></div>
      </div>

      <input 
        type="file" 
        accept="image/*" 
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={handleImageUpload}
        disabled={isAnalyzing || isProcessingImages}
      />

      <div className="hidden md:block h-full z-20 relative">
          <Sidebar 
            currentView={view} 
            onViewChange={setView}
            filters={filters}
            onFilterChange={handleFilterChange}
            onCuisineChange={handleCuisineChange}
            popularCuisines={POPULAR_CUISINES}
            onSaveFilters={handleSaveFilters}
            shoppingListCount={shoppingList.filter(i => !i.checked).length}
            onOpenSettings={() => setIsSettingsOpen(true)}
            language={language}
            onLogout={handleLogout}
          />
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-start">
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            <div className="w-4/5 max-w-xs h-full relative z-10 animate-slide-right shadow-2xl">
                <Sidebar 
                    currentView={view} 
                    onViewChange={setView}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onCuisineChange={handleCuisineChange}
                    popularCuisines={POPULAR_CUISINES}
                    onSaveFilters={handleSaveFilters}
                    shoppingListCount={shoppingList.filter(i => !i.checked).length}
                    onClose={() => setIsMobileMenuOpen(false)}
                    isMobile={true}
                    onOpenSettings={() => { setIsMobileMenuOpen(false); setIsSettingsOpen(true); }}
                    language={language}
                    onLogout={handleLogout}
                />
            </div>
            <style>{`
                @keyframes slideRight {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-right { animation: slideRight 0.3s cubic-bezier(0.16,1,0.3,1); }
            `}</style>
        </div>
      )}

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={language}
        onLanguageChange={setLanguage}
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        
        <MobileHeader />

        <main className="flex-1 overflow-y-auto pb-28 md:pb-0 scroll-smooth overscroll-none">
          {view === 'home' && (
             <div className="h-full flex flex-col items-center p-6 text-center overflow-y-auto">
                <div className="max-w-xl w-full mt-4 md:mt-20 animate-slide-up">
                    <h2 className="text-4xl md:text-6xl font-extrabold mb-4 text-slate-800 dark:text-white tracking-tight leading-[1.1]">
                        {t.whatsCooking} <br/> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">{t.tonight}</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-10 text-base md:text-lg font-medium max-w-md mx-auto leading-relaxed">
                        {t.subtitle}
                    </p>
                    
                    {/* Enhanced Search Input */}
                    <div className="mb-8 w-full relative z-30 group">
                      <form onSubmit={handleManualSearch} className="relative">
                         <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                         <input 
                           type="text" 
                           placeholder={t.searchPlaceholder}
                           value={searchQuery}
                           onChange={handleSearchInput}
                           onFocus={() => { if(searchQuery.length > 0) setShowSuggestions(true); }}
                           onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                           className="w-full pl-6 pr-14 py-4 md:py-5 rounded-2xl border-0 ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-emerald-500/50 text-lg font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none transition-all relative z-10"
                         />
                         
                         <button 
                           type="submit"
                           className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 z-20 hover:scale-105 active:scale-95"
                         >
                           <Search size={20} strokeWidth={2.5} />
                         </button>
                      </form>
                      
                      {/* Auto Suggestions */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-30 animate-fade-in text-left p-2">
                            {suggestions.map((term, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSuggestionClick(term)}
                                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-3 group"
                                >
                                    <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-slate-600 transition-colors">
                                        <Search size={14} />
                                    </div>
                                    <span className="font-semibold text-sm">{term}</span>
                                </button>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Saved Search Chips */}
                    {savedSearches.length > 0 && (
                        <div className="mb-8 w-full overflow-x-auto pb-4 no-scrollbar">
                            <div className="flex gap-3 justify-start md:justify-center px-1">
                                {savedSearches.map(saved => (
                                    <div 
                                        key={saved.id}
                                        onClick={() => handleApplySavedSearch(saved)}
                                        className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full px-4 py-2 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-md cursor-pointer transition-all shadow-sm shrink-0 group active:scale-95"
                                    >
                                        <Bookmark size={12} className="text-emerald-500 fill-emerald-500" />
                                        <span className="font-bold text-slate-600 dark:text-slate-300 text-xs md:text-sm whitespace-nowrap max-w-[120px] truncate">{saved.query}</span>
                                        <button 
                                            onClick={(e) => handleDeleteSearch(saved.id, e)}
                                            className="ml-1 p-0.5 text-slate-300 hover:text-red-500 rounded-full transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Main Action Scan Card */}
                    <div className="relative w-full mt-4">
                        {/* Only show the large upload button if no images are selected */}
                        {uploadedImages.length === 0 ? (
                            <div className="relative group perspective-1000">
                                <button 
                                    onClick={triggerCamera}
                                    disabled={isAnalyzing || isProcessingImages}
                                    className={`w-full transition-all duration-500 ease-out hover:-translate-y-1 active:scale-[0.98] rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/60 dark:border-slate-700 ${isAnalyzing ? 'bg-emerald-50 dark:bg-emerald-900/10 cursor-wait' : 'bg-white dark:bg-slate-800'}`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white to-white dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 opacity-100"></div>
                                    
                                    <div className="w-full py-10 md:py-16 flex flex-col items-center justify-center relative z-10">
                                        {/* Decorative blobs */}
                                        <div className="absolute top-0 right-0 p-0 w-64 h-64 bg-emerald-100/50 dark:bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                        <div className="absolute bottom-0 left-0 p-0 w-56 h-56 bg-teal-100/50 dark:bg-teal-500/10 rounded-full blur-3xl -ml-20 -mb-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                        
                                        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-8 rounded-full mb-6 text-emerald-600 dark:text-emerald-400 shadow-inner group-hover:scale-110 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-all duration-500">
                                            <Camera size={48} strokeWidth={1.5} />
                                        </div>
                                        <span className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{t.addPhotos}</span>
                                        <span className="text-slate-400 text-sm mt-2 font-medium max-w-[240px] leading-snug group-hover:text-emerald-600/70 dark:group-hover:text-emerald-400/70 transition-colors">
                                            {t.snapFridge}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        ) : (
                            /* Image Staging Area */
                            <div className="w-full bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/60 dark:border-slate-700 animate-fade-in relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-white dark:from-slate-900/50 dark:to-slate-900 pointer-events-none"></div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-extrabold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                                            <ImagePlus size={20} className="text-emerald-500" />
                                            {t.selectedPhotos} ({uploadedImages.length}/5)
                                        </h3>
                                        {uploadedImages.length < 5 && (
                                            <button 
                                                onClick={triggerCamera}
                                                className="text-xs font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1"
                                                disabled={isAnalyzing}
                                            >
                                                <Plus size={12} strokeWidth={3} /> Add
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-8">
                                        {uploadedImages.map((img, idx) => (
                                            <div key={idx} className="aspect-square relative group rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
                                                <img src={`data:image/jpeg;base64,${img}`} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                                                <button 
                                                    onClick={() => handleRemoveImage(idx)}
                                                    className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                                                    disabled={isAnalyzing}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {uploadedImages.length < 5 && (
                                            <button 
                                                onClick={triggerCamera}
                                                disabled={isAnalyzing}
                                                className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:border-emerald-300 dark:hover:border-emerald-600 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all gap-1"
                                            >
                                                <Plus size={20} />
                                                <span className="text-[10px] font-bold">Add</span>
                                            </button>
                                        )}
                                    </div>

                                    <button 
                                        onClick={handleAnalyzeImages}
                                        disabled={isAnalyzing}
                                        className={`w-full py-4 md:py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl ${
                                            isAnalyzing 
                                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300 cursor-wait' 
                                            : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-500/30 active:scale-95'
                                        }`}
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 size={24} className="animate-spin" />
                                                {t.analyzing}
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={24} className="fill-white" />
                                                {t.analyzeIngredients}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* Loading Overlay during file processing */}
                        {isProcessingImages && (
                             <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 rounded-[2.5rem] flex items-center justify-center">
                                 <Loader2 size={32} className="text-emerald-500 animate-spin" />
                             </div>
                        )}
                    </div>

                    {ingredients.length > 0 && !isAnalyzing && (
                        <div className="mt-8 text-left bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 dark:border-slate-700 shadow-xl shadow-emerald-900/5 animate-slide-up">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center justify-between text-xs uppercase tracking-widest">
                                {t.detectedIngredients}
                                <button 
                                  onClick={() => findRecipes(ingredients)}
                                  className="text-emerald-700 dark:text-emerald-300 text-[10px] normal-case bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-900 flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-full transition-colors"
                                >
                                    <RefreshCw size={12} /> {t.refresh}
                                </button>
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {ingredients.map((ing, i) => (
                                    <span key={i} className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-4 py-1.5 rounded-full text-sm text-slate-700 dark:text-slate-200 font-bold shadow-sm">
                                        {ing}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Browse by Mood Collections */}
                    <div className="w-full mt-12 animate-slide-up" style={{ animationDelay: '100ms' }}>
                        <div className="flex items-center justify-between mb-6 px-1">
                            <h3 className="font-black text-slate-800 dark:text-white text-lg flex items-center gap-2">
                                <Sparkles size={18} className="text-emerald-500" />
                                {t.browseMood}
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {MOOD_COLLECTIONS.map((col) => (
                                <button 
                                    key={col.id}
                                    onClick={() => performSearch(col.search)}
                                    className={`flex items-start gap-4 p-5 rounded-[1.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:shadow-slate-100/50 dark:hover:shadow-none transition-all text-left group active:scale-95 ${col.border}`}
                                >
                                    <div className={`p-3.5 rounded-2xl ${col.bg} ${col.color} group-hover:scale-110 transition-transform shadow-sm`}>
                                        <col.icon size={22} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h4 className={`font-extrabold text-slate-800 dark:text-slate-200 text-[15px] group-hover:${col.color} transition-colors`}>{col.title}</h4>
                                        <p className="text-xs text-slate-400 font-bold mt-1 tracking-wide">{col.subtitle}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-16 mb-8 flex flex-col items-center gap-2 opacity-50">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {t.poweredBy}
                        </div>
                    </div>
                </div>
             </div>
          )}

          {view === 'chat' && (
              <ChatBot 
                initialMessage={chatInitialMessage} 
                onClearInitialMessage={() => setChatInitialMessage('')} 
              />
          )}

          {view === 'recipes' && (
            <div className="p-4 md:p-12 max-w-7xl mx-auto">
               <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 animate-fade-in">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t.suggestedRecipes}</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                      {ingredients.length > 0 ? `Curated based on ${ingredients.length} ingredients` : `Results for "${searchQuery}"`}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {!ingredients.length && searchQuery && (
                        <button 
                            onClick={handleSaveSearch}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-100 dark:border-emerald-800 justify-center active:scale-95"
                        >
                            <Bookmark size={16} />
                            <span>{t.saveSearch}</span>
                        </button>
                    )}

                    <div className="relative group min-w-[140px]">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Clock className="text-slate-400 group-hover:text-emerald-500 transition-colors" size={16} />
                        </div>
                        <select 
                            value={filters.maxPrepTime || 'any'}
                            onChange={handlePrepTimeChange}
                            className="w-full pl-10 pr-8 py-2.5 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer hover:ring-emerald-300 transition-all shadow-sm"
                        >
                            <option value="any">Any Time</option>
                            <option value="15">Under 15m</option>
                            <option value="30">Under 30m</option>
                            <option value="45">Under 45m</option>
                            <option value="60">Under 1h</option>
                        </select>
                         <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                             <ArrowDownUp className="text-slate-300" size={12} />
                         </div>
                    </div>

                    <div className="relative group min-w-[180px]">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <ArrowDownUp className="text-slate-400 group-hover:text-emerald-500 transition-colors" size={16} />
                        </div>
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full pl-10 pr-8 py-2.5 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer hover:ring-emerald-300 transition-all shadow-sm"
                        >
                            <option value="default">Relevance</option>
                            <option value="time">Fastest First</option>
                            <option value="difficulty">Easiest First</option>
                            <option value="calories">Lowest Calories</option>
                            <option value="protein-high">Highest Protein</option>
                            <option value="carbs-low">Lowest Carbs</option>
                            <option value="fiber-high">Highest Fiber</option>
                        </select>
                    </div>
                  </div>
               </div>

               {isSearching ? (
                   <div className="flex flex-col items-center justify-center py-40">
                       <div className="relative mb-6">
                           <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
                           <Loader2 size={56} className="text-emerald-500 animate-spin relative z-10" />
                       </div>
                       <p className="text-slate-800 dark:text-slate-200 font-bold text-xl">Curating your menu...</p>
                       <p className="text-slate-400 font-medium mt-1">Checking ingredients & dietary needs</p>
                   </div>
               ) : recipes.length === 0 ? (
                   <div className="text-center py-40 bg-white/50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                       <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">{t.noRecipes}</p>
                       <p className="text-slate-400 dark:text-slate-500 mt-1">{t.tryAdjusting}</p>
                       <button onClick={() => setView('home')} className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20">
                           {t.newSearch}
                       </button>
                   </div>
               ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 pb-12">
                       {sortedRecipes.map((recipe, idx) => (
                           <div key={recipe.id} className="animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                               <RecipeCard 
                                 recipe={recipe} 
                                 onUpdateImage={updateRecipeImage}
                                 onAddUserImages={addUserImages}
                                 onClick={() => {
                                     setSelectedRecipe(recipe);
                                     setView('recipe-details');
                                 }} 
                                 onQuickView={() => setQuickViewRecipe(recipe)}
                               />
                           </div>
                       ))}
                   </div>
               )}
            </div>
          )}

          {view === 'recipe-details' && selectedRecipe && (
             <RecipeDetails 
               recipe={selectedRecipe}
               onBack={() => setView('recipes')}
               onStartCooking={() => setView('cooking')}
               onAddToShoppingList={addToShoppingList}
               onUpdateImage={updateRecipeImage}
               onAskChef={handleAskChef}
             />
          )}

          {view === 'history' && (
            <div className="p-4 md:p-12 max-w-7xl mx-auto">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t.cookedHistory}</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Your culinary achievements</p>
                  </div>
               </div>

               {cookedRecipes.length === 0 ? (
                   <div className="text-center py-40 bg-white/50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center">
                       <div className="bg-slate-100 dark:bg-slate-700 p-6 rounded-full mb-6">
                            <History size={40} className="text-slate-400" />
                       </div>
                       <p className="text-slate-600 dark:text-slate-300 font-bold text-lg">No meals cooked yet.</p>
                       <button onClick={() => setView('home')} className="mt-6 text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                          Find something to cook
                       </button>
                   </div>
               ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                       {cookedRecipes.map(recipe => (
                           <RecipeCard 
                             key={recipe.id} 
                             recipe={recipe} 
                             onUpdateImage={updateRecipeImage}
                             onAddUserImages={addUserImages}
                             onClick={() => {
                                 setSelectedRecipe(recipe);
                                 setView('recipe-details');
                             }} 
                             onQuickView={() => setQuickViewRecipe(recipe)}
                           />
                       ))}
                   </div>
               )}
            </div>
          )}

          {view === 'shopping' && (
             <ShoppingList 
                items={shoppingList} 
                onRemove={removeFromShoppingList} 
                onAdd={addSingleItem} 
                onToggle={toggleShoppingItem}
             />
          )}
        </main>

        <BottomNav />
      </div>

      {quickViewRecipe && (
        <QuickViewModal recipe={quickViewRecipe} onClose={() => setQuickViewRecipe(null)} />
      )}

      {view === 'cooking' && selectedRecipe && (
        <CookingMode 
            recipe={selectedRecipe} 
            onClose={() => setView('recipe-details')}
            onAddToShoppingList={addToShoppingList}
            onFinish={handleFinishCooking}
        />
      )}
    </div>
  );
};

export default App;