import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Clock, Flame, BarChart, ShoppingBag, ChefHat, Check, 
  Image as ImageIcon, Sparkles, Loader2, Settings, Droplet, Wheat, 
  Beef, MessageCircleQuestion, Activity, ChevronDown, ChevronUp, Lightbulb,
  Heart, Share2, Leaf, Waves, Zap, Dumbbell, Sun, Eye, Bean, Globe, ExternalLink
} from 'lucide-react';
import { Recipe } from '../types';
import { generateRecipeImage, getChefTips } from '../services/gemini';

interface RecipeDetailsProps {
  recipe: Recipe;
  onBack: () => void;
  onStartCooking: () => void;
  onAddToShoppingList: (items: string[]) => void;
  onUpdateImage: (id: string, imageUrl: string) => void;
  onAskChef: (query: string) => void;
}

export const RecipeDetails: React.FC<RecipeDetailsProps> = ({ 
  recipe, 
  onBack, 
  onStartCooking, 
  onAddToShoppingList,
  onUpdateImage,
  onAskChef
}) => {
  const [hasIngredients, setHasIngredients] = useState<Set<string>>(new Set());
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showNutritionDetails, setShowNutritionDetails] = useState(false);
  const [tips, setTips] = useState<string[]>([]);
  const [isLoadingTips, setIsLoadingTips] = useState(false);

  useEffect(() => {
    const initialHave = new Set<string>();
    recipe.ingredients.forEach(ing => {
      const isMissing = recipe.missingIngredients.some(
        missing => missing.name.toLowerCase() === ing.name.toLowerCase()
      );
      if (!isMissing) {
        initialHave.add(ing.name);
      }
    });
    setHasIngredients(initialHave);
  }, [recipe]);

  useEffect(() => {
      if (recipe.tips && recipe.tips.length > 0) {
          setTips(recipe.tips);
          return;
      }
      
      const fetchTips = async () => {
          setIsLoadingTips(true);
          setTips([]);
          try {
             const fetchedTips = await getChefTips(recipe.title, recipe.ingredients.map(i => i.name));
             setTips(fetchedTips);
          } catch (e) {
             console.error("Failed to load tips", e);
          } finally {
             setIsLoadingTips(false);
          }
      };

      fetchTips();
  }, [recipe.id]);

  const toggleIngredient = (ingredientName: string) => {
    const newHas = new Set(hasIngredients);
    if (newHas.has(ingredientName)) {
      newHas.delete(ingredientName);
    } else {
      newHas.add(ingredientName);
    }
    setHasIngredients(newHas);
  };

  const missingItems = recipe.ingredients.filter(ing => !hasIngredients.has(ing.name));
  const progress = (hasIngredients.size / recipe.ingredients.length) * 100;

  const handleGenerateImage = async () => {
    if (isGeneratingImage) return;
    if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
            try {
                await (window as any).aistudio.openSelectKey();
            } catch (e) {
                console.error("Key selection failed", e);
                return;
            }
        }
    }

    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateRecipeImage(recipe.title, imageSize);
      if (imageUrl) {
        onUpdateImage(recipe.id, imageUrl);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate image.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return null;
    }
  };

  const displaySource = recipe.sourceName || (recipe.sourceUrl ? getHostname(recipe.sourceUrl) : null);

  const extraNutrients = [
      { label: 'Fiber', val: recipe.fiber, icon: Leaf, color: 'emerald' },
      { label: 'Sugar', val: recipe.sugar, icon: Sparkles, color: 'pink' },
      { label: 'Sodium', val: recipe.sodium, icon: Waves, color: 'blue' },
      { label: 'Cholesterol', val: recipe.cholesterol, icon: Heart, color: 'rose' },
      { label: 'Potassium', val: recipe.potassium, icon: Zap, color: 'yellow' },
      { label: 'Calcium', val: recipe.calcium, icon: Bean, color: 'stone' },
      { label: 'Iron', val: recipe.iron, icon: Dumbbell, color: 'slate' },
      { label: 'Vit A', val: recipe.vitaminA, icon: Eye, color: 'orange' },
      { label: 'Vit C', val: recipe.vitaminC, icon: Sun, color: 'amber' },
  ].filter(n => n.val);

  return (
    <div className="h-full flex flex-col bg-slate-50/50 overflow-y-auto font-sans scroll-smooth">
      {/* Immersive Hero Section */}
      <div className="relative h-[45vh] md:h-[55vh] shrink-0 group">
        {recipe.imageUrl ? (
          <>
            <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover animate-scale-in origin-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent opacity-90"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-transparent opacity-60"></div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-800 relative overflow-hidden">
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
             <div className="bg-white/5 backdrop-blur-sm p-8 rounded-full border border-white/10 mb-4 animate-float">
                 <ImageIcon size={64} className="opacity-70 text-white" />
             </div>
          </div>
        )}

        {/* Top Navigation Overlay */}
        <div className="absolute top-0 left-0 right-0 p-6 md:p-10 flex justify-between items-start z-30">
            <button 
                onClick={onBack}
                className="p-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white transition-all active:scale-95 border border-white/10 shadow-lg"
            >
                <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <div className="flex gap-3">
                 <button className="p-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white transition-all active:scale-95 border border-white/10 shadow-lg">
                    <Heart size={22} strokeWidth={2.5} />
                </button>
                 <button className="p-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white transition-all active:scale-95 border border-white/10 shadow-lg">
                    <Share2 size={22} strokeWidth={2.5} />
                </button>
            </div>
        </div>

        {/* Image Gen Controls */}
        <div className="absolute bottom-8 right-8 flex items-center gap-3 z-30 hidden md:flex">
           <div className="relative">
             <button 
                onClick={() => setShowSizeMenu(!showSizeMenu)}
                className="p-3.5 bg-black/40 text-white rounded-full hover:bg-black/60 backdrop-blur-md border border-white/10 transition-colors"
                title="Image Quality"
             >
                <Settings size={20} />
             </button>
             {showSizeMenu && (
                 <div className="absolute bottom-full right-0 mb-3 bg-white rounded-2xl shadow-xl overflow-hidden min-w-[140px] z-20 animate-slide-up">
                    <div className="p-2 space-y-1">
                        {['1K', '2K', '4K'].map(size => (
                            <button
                                key={size}
                                onClick={() => { setImageSize(size as any); setShowSizeMenu(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-bold rounded-xl transition-colors ${imageSize === size ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                 </div>
             )}
           </div>

           <button 
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
                className="flex items-center gap-2.5 px-6 py-3.5 bg-emerald-600/90 hover:bg-emerald-500 rounded-full text-white text-sm font-bold transition-all backdrop-blur-md shadow-lg hover:shadow-emerald-500/30 border border-emerald-400/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isGeneratingImage ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18} fill="currentColor" />}
                Generate {imageSize}
            </button>
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 pointer-events-none z-20">
          <div className="animate-slide-up">
              <h1 className="text-4xl md:text-7xl font-black text-white mb-6 leading-[1.05] tracking-tight drop-shadow-xl">{recipe.title}</h1>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-slate-100 text-sm font-bold">
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/10 shadow-lg">
                        <Clock size={16} className="text-emerald-300" /> {recipe.prepTime}
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/10 shadow-lg">
                        <Flame size={16} className="text-orange-300" /> {recipe.calories}
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/10 shadow-lg">
                        <BarChart size={16} className="text-blue-300" /> {recipe.difficulty}
                    </div>
                </div>

                {displaySource && recipe.sourceUrl && (
                    <a 
                        href={recipe.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pointer-events-auto flex items-center gap-2 bg-black/40 hover:bg-emerald-600/80 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/10 shadow-lg transition-colors group"
                    >
                        <Globe size={16} className="text-slate-300 group-hover:text-white" />
                        <span className="truncate max-w-[200px]">{displaySource}</span>
                        <ExternalLink size={12} className="opacity-50" />
                    </a>
                )}
              </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-10 md:p-12 max-w-7xl mx-auto w-full pb-40 space-y-12">
        
        {/* Modern Nutrition Dashboard */}
        {(recipe.protein || recipe.carbs || recipe.fat) && (
            <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12 relative overflow-hidden">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <Activity size={28} className="text-emerald-500" strokeWidth={2.5} />
                            Macro Nutrients
                        </h2>
                    </div>
                    {extraNutrients.length > 0 && (
                        <button 
                        onClick={() => setShowNutritionDetails(!showNutritionDetails)}
                        className="text-emerald-700 text-xs font-bold uppercase tracking-wider hover:bg-emerald-100 flex items-center gap-2 transition-colors px-5 py-2.5 rounded-full bg-emerald-50 border border-emerald-100"
                        >
                        {showNutritionDetails ? 'Show Less' : 'View Full Profile'}
                        {showNutritionDetails ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-4 md:gap-10">
                    {[
                        { label: 'Protein', val: recipe.protein, icon: Beef, color: 'blue' },
                        { label: 'Carbs', val: recipe.carbs, icon: Wheat, color: 'amber' },
                        { label: 'Fats', val: recipe.fat, icon: Droplet, color: 'rose' }
                    ].map((nutrient, i) => (
                        <div key={i} className={`relative overflow-hidden p-6 md:p-10 rounded-[2.5rem] bg-${nutrient.color}-50/40 border border-${nutrient.color}-100/50 flex flex-col items-center justify-center gap-4 group transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-${nutrient.color}-100/50`}>
                             <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-white shadow-lg shadow-${nutrient.color}-100 flex items-center justify-center text-${nutrient.color}-500 mb-1 group-hover:rotate-12 transition-transform duration-500 scale-110`}>
                                 <nutrient.icon size={28} strokeWidth={2.5} />
                             </div>
                             <div className="text-center z-10">
                                 <span className={`block text-3xl md:text-5xl font-black text-${nutrient.color}-900 tracking-tight`}>{nutrient.val || '-'}</span>
                                 <span className={`text-xs font-extrabold uppercase tracking-widest text-${nutrient.color}-400 mt-1 block`}>{nutrient.label}</span>
                             </div>
                        </div>
                    ))}
                </div>

                {extraNutrients.length > 0 && (
                    <div className={`transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${showNutritionDetails ? 'max-h-[1000px] opacity-100 mt-10' : 'max-h-0 opacity-0 mt-0'}`}>
                        <div className="pt-10 border-t border-slate-100">
                            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-8 text-center">Detailed Breakdown</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {extraNutrients.map((item, i) => (
                                    <div 
                                        key={i} 
                                        className={`flex flex-col p-5 rounded-3xl bg-${item.color}-50/30 border border-${item.color}-100/50 hover:bg-white hover:shadow-xl hover:shadow-${item.color}-500/10 transition-all duration-500 ${showNutritionDetails ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                                        style={{ transitionDelay: `${i * 50}ms` }}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`p-2 rounded-xl bg-${item.color}-100 text-${item.color}-600`}>
                                                <item.icon size={16} strokeWidth={2.5} />
                                            </div>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{item.label}</span>
                                        </div>
                                        <span className="font-black text-slate-700 text-2xl tracking-tight">{item.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Main Column: Ingredients */}
            <div className="md:col-span-2 space-y-8">
                 <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ingredients</h2>
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-5 py-2 rounded-full text-xs border border-emerald-200/50 shadow-sm">
                            {hasIngredients.size} / {recipe.ingredients.length} Ready
                        </span>
                    </div>

                    {/* Styled Progress Bar */}
                    <div className="h-4 bg-slate-100 rounded-full mb-12 overflow-hidden shadow-inner border border-slate-200/50">
                        <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(16,185,129,0.4)] relative" 
                        style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite] skew-x-12"></div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {recipe.ingredients.map((ing, idx) => {
                        const hasIt = hasIngredients.has(ing.name);
                        return (
                            <div 
                            key={idx} 
                            onClick={() => toggleIngredient(ing.name)}
                            className={`flex items-center p-5 rounded-2xl border transition-all cursor-pointer group select-none ${
                                hasIt 
                                ? 'bg-emerald-50/40 border-emerald-100/50 hover:bg-emerald-50/80' 
                                : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5'
                            }`}
                            >
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-6 transition-all duration-300 shrink-0 ${
                                    hasIt ? 'border-emerald-500 bg-emerald-500 scale-110 shadow-md shadow-emerald-200' : 'border-slate-300 group-hover:border-emerald-400'
                                }`}>
                                    {hasIt && <Check size={16} className="text-white" strokeWidth={3} />}
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className={`font-bold text-lg md:text-xl transition-colors ${hasIt ? 'text-emerald-900 line-through decoration-emerald-500/30' : 'text-slate-700'}`}>
                                            {ing.name}
                                        </span>
                                        <span className={`text-sm font-bold bg-slate-100 px-2 py-1 rounded-lg ${hasIt ? 'text-emerald-700/60 bg-emerald-100/50' : 'text-slate-500'}`}>
                                            {ing.quantity}
                                        </span>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAskChef(`What is a good substitute for ${ing.name} in the recipe "${recipe.title}"?`);
                                    }}
                                    className="p-3 text-slate-300 hover:text-emerald-600 hover:bg-emerald-100 rounded-full transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                                    title="Find substitution"
                                >
                                    <MessageCircleQuestion size={22} />
                                </button>
                            </div>
                        );
                        })}
                    </div>

                    {missingItems.length > 0 && (
                        <div className="mt-12 animate-slide-up">
                            <button 
                                onClick={() => onAddToShoppingList(missingItems.map(i => `${i.quantity} ${i.name}`))}
                                className="w-full flex items-center justify-center gap-3 py-5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all hover:shadow-2xl hover:shadow-slate-900/20 active:scale-[0.98]"
                            >
                                <ShoppingBag size={24} />
                                Add {missingItems.length} missing items to List
                            </button>
                        </div>
                    )}
                 </div>
            </div>

            {/* Sidebar Column: Tips */}
            <div className="md:col-span-1">
                 <div className="bg-amber-50 rounded-[3rem] border border-amber-100 p-10 sticky top-24 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-white text-amber-500 rounded-2xl shadow-sm border border-amber-100">
                            <Lightbulb size={28} strokeWidth={2.5} fill="currentColor" className="text-amber-500/20" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800">Chef's Tips</h2>
                    </div>
                    
                    {isLoadingTips ? (
                        <div className="flex flex-col items-center justify-center py-12 text-amber-800/50">
                            <Loader2 size={32} className="animate-spin mb-4 text-amber-500" />
                            <span className="text-sm font-bold tracking-wide animate-pulse">CONSULTING CHEF...</span>
                        </div>
                    ) : tips.length > 0 ? (
                        <ul className="space-y-6">
                            {tips.map((tip, idx) => (
                                <li key={idx} className="flex gap-4 text-sm leading-relaxed text-slate-700 group">
                                    <span className="shrink-0 w-8 h-8 rounded-full bg-white text-amber-600 font-black flex items-center justify-center text-xs mt-0.5 shadow-sm group-hover:scale-110 transition-transform border border-amber-200">
                                        {idx + 1}
                                    </span>
                                    <span className="font-bold pt-1 text-slate-700">{tip}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <div className="text-center py-12">
                             <p className="text-sm text-slate-400 italic mb-4 font-medium">No specific tips found.</p>
                             <button 
                                onClick={() => onAskChef(`Give me tips for cooking ${recipe.title}`)}
                                className="text-xs font-bold text-amber-700 hover:underline uppercase tracking-wider"
                             >
                                 Ask Chef Manually
                             </button>
                         </div>
                    )}
                 </div>
            </div>
        </div>

        {/* Start Cooking CTA - Sticky on Mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-6 pb-8 bg-gradient-to-t from-white via-white/95 to-transparent md:relative md:bg-none md:p-0 z-40 pointer-events-none">
            <div className="pointer-events-auto max-w-lg mx-auto md:max-w-none">
                <button 
                onClick={onStartCooking}
                className="w-full py-6 md:py-7 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xl font-black rounded-[2rem] shadow-2xl shadow-emerald-600/40 hover:shadow-emerald-600/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-4 active:scale-[0.98] ring-4 ring-white"
                >
                    <ChefHat size={32} className="md:w-9 md:h-9" strokeWidth={2.5} />
                    Start Cooking Mode
                </button>
                <p className="text-center text-slate-400 mt-4 text-[10px] font-extrabold uppercase tracking-widest hidden md:block opacity-60">
                    Features hands-free voice guidance
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};