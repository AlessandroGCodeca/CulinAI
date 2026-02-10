import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AuthScreen } from './components/AuthScreen';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetails } from './components/RecipeDetails';
import { ChatBot } from './components/ChatBot';
import { CookingMode } from './components/CookingMode';
import { ShoppingList } from './components/ShoppingList';
import { searchRecipesByQuery, analyzeFridgeImage, searchRecipes } from './services/gemini';
import { Recipe, ViewState, DietaryFilters, UserProfile, ShoppingItem, SavedSearch } from './types';
import { Search, ChefHat, Camera, Loader2, Sparkles, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const defaultFilters: DietaryFilters = {
  vegetarian: false,
  vegan: false,
  keto: false,
  glutenFree: false,
  dairyFree: false,
  lowCarb: false,
  cuisine: [],
  maxPrepTime: 'any'
};

function App() {
  // --- PERSISTENT STATE INITIALIZATION ---
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('culinai_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('culinai_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem('culinai_shopping');
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('culinai_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Regular State
  const [viewState, setViewState] = useState<ViewState>(userProfile ? 'home' : 'auth');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DietaryFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState('');

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => {
    if (userProfile) localStorage.setItem('culinai_user', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('culinai_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('culinai_shopping', JSON.stringify(shoppingList));
  }, [shoppingList]);
  
  useEffect(() => {
    localStorage.setItem('culinai_history', JSON.stringify(history));
  }, [history]);

  // Handlers
  const handleLogin = (name: string, secretKey: string) => {
    const profile: UserProfile = { 
        name, 
        secretKey,
        dietaryPreferences: defaultFilters,
        favorites: []
    };
    setUserProfile(profile);
    setViewState('home');
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setViewState('recipes');
    const results = await searchRecipesByQuery(searchQuery, filters);
    setRecipes(results);
    setIsSearching(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsSearching(true);
    setViewState('recipes');

    const imagePromises = Array.from(files).map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    const base64Images = await Promise.all(imagePromises);
    const base64Data = base64Images.map(img => img.split(',')[1]);
    
    // First analyze images
    const ingredients = await analyzeFridgeImage(base64Data);
    // Then search recipes
    const results = await searchRecipes(ingredients, filters);
    
    setRecipes(results);
    setIsSearching(false);
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const addToShoppingList = (items: string[]) => {
    const newItems = items.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name,
      checked: false
    }));
    setShoppingList(prev => [...prev, ...newItems]);
  };

  const toggleShoppingItem = (id: string) => {
    setShoppingList(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const removeShoppingItem = (id: string) => {
    setShoppingList(prev => prev.filter(item => item.id !== id));
  };

  const handleAskChef = (query: string) => {
      setChatInitialMessage(query);
      setViewState('chat');
  };

  if (viewState === 'auth') {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-[#0B0F17] text-slate-200 font-sans selection:bg-emerald-500/30">
      <Sidebar 
        viewState={viewState} 
        setViewState={setViewState} 
        userProfile={userProfile}
        favoritesCount={favorites.length}
        shoppingCount={shoppingList.filter(i => !i.checked).length}
        onLogout={() => {
            localStorage.removeItem('culinai_user');
            setUserProfile(null);
            setViewState('auth');
        }}
      />

      <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8 transition-all duration-300">
        
        {/* Header Search Bar (Visible on most pages) */}
        {viewState !== 'cooking' && viewState !== 'recipe-details' && (
            <div className="max-w-5xl mx-auto mb-8 sticky top-4 z-30">
                <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="What are you craving? (e.g. 'Spicy Pasta', 'Healthy Dinner')"
                                className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 text-white pl-12 pr-12 py-4 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 shadow-2xl transition-all"
                            />
                            {searchQuery && (
                                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-800 rounded-full">
                                    <X className="w-4 h-4 text-slate-500" />
                                </button>
                            )}
                        </div>
                        <button 
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-4 rounded-2xl border transition-all ${
                                showFilters ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                        >
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Filters Drawer */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                className="overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl"
                            >
                                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {Object.entries(filters).map(([key, value]) => {
                                        if (key === 'cuisine' || key === 'maxPrepTime') return null;
                                        return (
                                            <label key={key} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${value ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                                                    {value && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    className="hidden"
                                                    checked={value as boolean}
                                                    onChange={() => setFilters(prev => ({ ...prev, [key]: !prev[key as keyof DietaryFilters] }))}
                                                />
                                                <span className="capitalize text-sm text-slate-300">{key.replace(/([A-Z])/g, ' $1')}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </div>
        )}

        {/* --- MAIN CONTENT AREA --- */}
        <div className="max-w-7xl mx-auto">
            
            {/* HOME VIEW */}
            {viewState === 'home' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="space-y-4"
                    >
                        <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight">
                            What's cooking <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">tonight?</span>
                        </h1>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Discover delicious recipes by scanning your ingredients or simply searching for a craving.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                        <button 
                            onClick={() => document.getElementById('photo-upload')?.click()}
                            className="group relative h-48 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 hover:border-indigo-500/50 transition-all overflow-hidden flex flex-col items-center justify-center gap-4"
                        >
                            <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
                            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Camera className="w-8 h-8 text-indigo-400" />
                            </div>
                            <span className="text-xl font-semibold text-indigo-200">Scan Ingredients</span>
                            <input 
                                type="file" 
                                id="photo-upload"
                                multiple 
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </button>

                        <button 
                            onClick={() => document.querySelector('input')?.focus()}
                            className="group relative h-48 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/50 transition-all overflow-hidden flex flex-col items-center justify-center gap-4"
                        >
                            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Search className="w-8 h-8 text-emerald-400" />
                            </div>
                            <span className="text-xl font-semibold text-emerald-200">Search Recipes</span>
                        </button>
                    </div>
                </div>
            )}

            {/* RECIPES LIST VIEW */}
            {viewState === 'recipes' && (
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white">Suggested Recipes</h2>
                        {isSearching && (
                            <div className="flex items-center gap-2 text-emerald-500">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Cooking up ideas...</span>
                            </div>
                        )}
                    </div>
                    
                    {recipes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recipes.map((recipe, idx) => (
                                <motion.div 
                                    key={recipe.id || idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <RecipeCard 
                                        recipe={recipe} 
                                        onClick={() => {
                                            setSelectedRecipe(recipe);
                                            setViewState('recipe-details');
                                        }}
                                        isFavorite={favorites.includes(recipe.id)}
                                        onToggleFavorite={(e) => toggleFavorite(e, recipe.id)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    ) : !isSearching && (
                        <div className="text-center py-20 text-slate-500">
                            <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>No recipes found yet. Try searching or scanning!</p>
                        </div>
                    )}
                </div>
            )}

            {/* SHOPPING LIST VIEW */}
            {viewState === 'shopping' && (
                <ShoppingList 
                    items={shoppingList}
                    onToggle={toggleShoppingItem}
                    onRemove={removeShoppingItem}
                    onAdd={(name) => addToShoppingList([name])}
                />
            )}

            {/* CHAT VIEW */}
            {viewState === 'chat' && (
                <ChatBot 
                    initialMessage={chatInitialMessage}
                    onClearInitialMessage={() => setChatInitialMessage('')}
                />
            )}
        </div>

        {/* RECIPE DETAILS MODAL */}
        <AnimatePresence>
            {viewState === 'recipe-details' && selectedRecipe && (
                <RecipeDetails 
                    recipe={selectedRecipe} 
                    onBack={() => setViewState('recipes')}
                    onStartCooking={() => setViewState('cooking')}
                    onAddToShoppingList={addToShoppingList}
                    onAskChef={handleAskChef}
                />
            )}
        </AnimatePresence>

        {/* COOKING MODE */}
        <AnimatePresence>
            {viewState === 'cooking' && selectedRecipe && (
                <CookingMode 
                    recipe={selectedRecipe} 
                    onClose={() => setViewState('recipe-details')}
                    onComplete={() => {
                        setHistory(prev => [...prev, selectedRecipe.id]);
                        setViewState('home');
                    }}
                />
            )}
        </AnimatePresence>

      </main>
      
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>
    </div>
  );
}

// Helper component for Filters (imports were cleaner to inline above but needed CheckCircle2)
import { CheckCircle2 } from 'lucide-react';

export default App;
