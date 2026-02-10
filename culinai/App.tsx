import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AuthScreen } from './components/AuthScreen';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetails } from './components/RecipeDetails';
import { ChatBot } from './components/ChatBot';
import { CookingMode } from './components/CookingMode';
import { ShoppingList } from './components/ShoppingList';
import { SettingsModal } from './components/SettingsModal';
import { searchRecipesByQuery, analyzeFridgeImage, searchRecipes } from './services/gemini';
import { Recipe, ViewState, DietaryFilters, UserProfile, ShoppingItem, Language } from './types';
import { Search, ChefHat, Camera, Loader2, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// NEW: Import translations
import { translations } from './constants/translations';

const defaultFilters: DietaryFilters = {
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
};

function App() {
  // --- STATE ---
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [viewState, setViewState] = useState<ViewState>('auth');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DietaryFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState('');
  
  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // --- DERIVED STATE ---
  const t = translations[language];

  // --- THEME EFFECT ---
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handlers
  const handleLogin = (name: string, secretKey: string) => {
    setUserProfile({ name, secretKey, dietaryPreferences: defaultFilters, favorites: [] });
    setViewState('home');
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setViewState('recipes');
    const results = await searchRecipesByQuery(searchQuery, filters, language);
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
    
    const ingredients = await analyzeFridgeImage(base64Data, language);
    const results = await searchRecipes(ingredients, filters, language);
    
    setRecipes(results);
    setIsSearching(false);
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
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
    setShoppingList(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const removeShoppingItem = (id: string) => {
    setShoppingList(prev => prev.filter(item => item.id !== id));
  };

  const handleAskChef = (query: string) => {
      setChatInitialMessage(query);
      setViewState('chat');
  };

  const handleToggleFilter = (key: keyof DietaryFilters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // RESTORED: Cuisine Toggling
  const handleToggleCuisine = (cuisine: string) => {
    setFilters(prev => {
      const current = prev.cuisine;
      const updated = current.includes(cuisine) 
        ? current.filter(c => c !== cuisine)
        : [...current, cuisine];
      return { ...prev, cuisine: updated };
    });
  };

  if (viewState === 'auth') {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className={`flex min-h-screen font-sans selection:bg-emerald-500/30 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0B0F17] text-slate-200' : 'bg-slate-50 text-slate-800'
    }`}>
      <Sidebar 
        viewState={viewState} 
        setViewState={setViewState} 
        userProfile={userProfile}
        favoritesCount={favorites.length}
        shoppingCount={shoppingList.filter(i => !i.checked).length}
        onLogout={() => { setUserProfile(null); setViewState('auth'); }}
        onOpenSettings={() => setShowSettings(true)}
        filters={filters}
        onToggleFilter={handleToggleFilter}
        // NEW PROPS
        t={t}
        onToggleCuisine={handleToggleCuisine}
      />

      <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8 transition-all duration-300">
        
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
                                placeholder={t.searchPlaceholder || "What are you craving?"}
                                className={`w-full backdrop-blur-xl border pl-12 pr-12 py-4 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 shadow-2xl transition-all ${
                                  theme === 'dark' 
                                    ? 'bg-slate-900/90 border-slate-800 text-white placeholder-slate-500' 
                                    : 'bg-white/90 border-slate-200 text-slate-900 placeholder-slate-400'
                                }`}
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
                            className={`lg:hidden p-4 rounded-2xl border transition-all ${
                              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                            }`}
                        >
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>
        )}

        <div className="max-w-7xl mx-auto">
            {viewState === 'home' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="space-y-4"
                    >
                        <h1 className={`text-4xl sm:text-6xl font-bold tracking-tight ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                            {t.whatsCooking || "What's cooking"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">tonight?</span>
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
                            <input type="file" id="photo-upload" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </button>

                        <button 
                            onClick={() => document.querySelector('input')?.focus()}
                            className="group relative h-48 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/50 transition-all overflow-hidden flex flex-col items-center justify-center gap-4"
                        >
                            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Search className="w-8 h-8 text-emerald-400" />
                            </div>
                            <span className="text-xl font-semibold text-emerald-200">{t.findRecipes || "Search Recipes"}</span>
                        </button>
                    </div>
                </div>
            )}

            {viewState === 'recipes' && (
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {t.suggestedRecipes || "Suggested Recipes"}
                        </h2>
                        {isSearching && (
                            <div className="flex items-center gap-2 text-emerald-500">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>{t.generating || "Cooking up ideas..."}</span>
                            </div>
                        )}
                    </div>
                    
                    {recipes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recipes.map((recipe, idx) => (
                                <motion.div key={recipe.id || idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                                    <RecipeCard 
                                        recipe={recipe} 
                                        onClick={() => { setSelectedRecipe(recipe); setViewState('recipe-details'); }}
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

            {viewState === 'shopping' && (
                <ShoppingList items={shoppingList} onToggle={toggleShoppingItem} onRemove={removeShoppingItem} onAdd={(name) => addToShoppingList([name])} />
            )}

            {viewState === 'chat' && (
                <ChatBot initialMessage={chatInitialMessage} onClearInitialMessage={() => setChatInitialMessage('')} />
            )}
        </div>

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

        <AnimatePresence>
            {viewState === 'cooking' && selectedRecipe && (
                <CookingMode 
                    recipe={selectedRecipe} 
                    onClose={() => setViewState('recipe-details')}
                    onComplete={() => { setHistory(prev => [...prev, selectedRecipe.id]); setViewState('home'); }}
                />
            )}
        </AnimatePresence>
        
        <AnimatePresence>
            <SettingsModal 
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                language={language}
                setLanguage={setLanguage}
                theme={theme}
                setTheme={setTheme}
            />
        </AnimatePresence>

      </main>
      
      {/* Background Ambience */}
      {theme === 'dark' && (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
        </div>
      )}
    </div>
  );
}

export default App;
