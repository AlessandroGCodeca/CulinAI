import React, { useState, useEffect } from 'react';
import { X, Clock, Flame, ChefHat, ExternalLink, Share2, Heart, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Recipe } from '../types';
// FIX: Pointing to the correct file name "gemini"
import { generateRecipeImage } from '../services/gemini';

interface RecipeDetailsProps {
  recipe: Recipe;
  onBack: () => void;
  onStartCooking?: () => void;
  onAddToShoppingList?: (items: string[]) => void;
  onUpdateImage?: (id: string, imageUrl: string) => void;
  onAskChef?: (query: string) => void;
}

export const RecipeDetails: React.FC<RecipeDetailsProps> = ({ recipe: initialRecipe, onBack }) => {
  const [recipe, setRecipe] = useState(initialRecipe);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');

  // AUTOMATICALLY load image if it's missing
  useEffect(() => {
    const loadImage = async () => {
      if (!recipe.image && !recipe.imageUrl) {
        // Fallback: Use the recipe title keyword if available, or first 2 words of title
        const keyword = recipe.imageKeyword || recipe.title.split(' ').slice(0, 2).join(' ');
        const imageUrl = await generateRecipeImage(keyword);
        if (imageUrl) {
          setRecipe(prev => ({ ...prev, image: imageUrl }));
        }
      }
    };
    loadImage();
  }, [recipe.id, recipe.image, recipe.imageUrl, recipe.title, recipe.imageKeyword]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onBack}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-800"
      >
        {/* Header Image Section */}
        <div className="relative h-64 sm:h-80 shrink-0 overflow-hidden group">
          {recipe.image || recipe.imageUrl ? (
            <img 
              src={recipe.image || recipe.imageUrl} 
              alt={recipe.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              <ChefHat className="w-16 h-16 text-slate-700" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          
          {/* Top Actions */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors border border-white/10">
              <Heart className="w-5 h-5" />
            </button>
            <button className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors border border-white/10">
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={onBack}
              className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight shadow-sm">
              {recipe.title}
            </h2>
            <div className="flex flex-wrap gap-3 sm:gap-4 text-sm sm:text-base">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white">
                <Clock className="w-4 h-4" />
                <span>{recipe.prepTime}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-orange-200">
                <Flame className="w-4 h-4" />
                <span>{recipe.calories}</span>
              </div>
              {recipe.sourceName && (
                <a 
                  href={recipe.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 backdrop-blur-md border border-emerald-500/30 text-emerald-200 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{recipe.sourceName}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 sm:p-8 space-y-8">
            
            {/* Description */}
            <p className="text-lg text-slate-300 leading-relaxed max-w-3xl">
              {recipe.description}
            </p>

            {/* Macro Cards */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
               <div className="flex items-center gap-2 mb-4 text-slate-300 font-medium">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                  <span>Nutrition Per Serving</span>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Protein', value: recipe.protein, color: 'text-blue-400' },
                    { label: 'Carbs', value: recipe.carbs, color: 'text-amber-400' },
                    { label: 'Fats', value: recipe.fat, color: 'text-rose-400' },
                    { label: 'Sugar', value: recipe.sugar || 'N/A', color: 'text-emerald-400' },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                       <div className={`text-xl font-bold ${item.color} mb-1`}>{item.value}</div>
                       <div className="text-xs text-slate-500 uppercase tracking-wider">{item.label}</div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-slate-700">
              <button
                onClick={() => setActiveTab('ingredients')}
                className={`pb-4 text-lg font-medium transition-colors relative ${
                  activeTab === 'ingredients' ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ingredients
                {activeTab === 'ingredients' && (
                  <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('instructions')}
                className={`pb-4 text-lg font-medium transition-colors relative ${
                  activeTab === 'instructions' ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Instructions
                {activeTab === 'instructions' && (
                  <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                )}
              </button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'ingredients' ? (
                <motion.div 
                  key="ingredients"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {recipe.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 group hover:border-slate-600 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-emerald-500/50 group-hover:bg-emerald-500 transition-colors" />
                      <span className="font-medium text-slate-200">{ing.name}</span>
                      <div className="flex-1 h-px bg-slate-700/50" />
                      <span className="text-slate-400 tabular-nums">{ing.quantity}</span>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="instructions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {recipe.instructions.map((step, idx) => (
                    <div key={idx} className="flex gap-6">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-emerald-500 shrink-0">
                          {idx + 1}
                        </div>
                        {idx !== recipe.instructions.length - 1 && (
                          <div className="w-px h-full bg-slate-800" />
                        )}
                      </div>
                      <p className="text-slate-300 leading-relaxed pt-1">
                        {step}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </motion.div>
    </div>
  );
};
