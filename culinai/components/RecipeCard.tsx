import React, { useState } from 'react';
import { Clock, Flame, ChefHat, Heart, ChevronRight, CheckCircle2, AlertCircle, Wine } from 'lucide-react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  // These were missing in your file, causing the error
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, isFavorite, onToggleFavorite }) => {
  const [imageError, setImageError] = useState(false);
  const displayImage = !imageError ? (recipe.image || recipe.imageUrl) : null;
  const missingCount = recipe.missingIngredients?.length || 0;

  return (
    <div 
      onClick={onClick}
      className="group relative bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-slate-100 h-full flex flex-col"
    >
      <div className="relative h-48 overflow-hidden bg-slate-100">
        {displayImage ? (
          <img 
            src={displayImage} 
            alt={recipe.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <ChefHat className="w-12 h-12 mb-2 opacity-50" />
            <span className="text-xs font-medium uppercase tracking-wider">No Image</span>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Favorite Button */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-10px] group-hover:translate-y-0 duration-300">
          <button 
            onClick={onToggleFavorite}
            className={`p-2 rounded-full backdrop-blur-md transition-colors ${
              isFavorite 
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                : 'bg-white/90 text-slate-600 hover:bg-white hover:text-rose-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          {recipe.dietaryTags?.slice(0, 2).map((tag, i) => (
            <span key={i} className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-black/40 backdrop-blur-md rounded-full border border-white/10">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2">
          {recipe.title}
        </h3>
        
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 mb-4">
          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5" />
            <span>{recipe.prepTime}</span>
          </div>
          <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
            <Flame className="w-3.5 h-3.5" />
            <span>{recipe.calories}</span>
          </div>
          {recipe.drinkPairing && (
             <div className="flex items-center gap-1.5 text-purple-600 bg-purple-50 px-2 py-1 rounded-md" title={recipe.drinkPairing}>
               <Wine className="w-3.5 h-3.5" />
               <span className="max-w-[80px] truncate">{recipe.drinkPairing}</span>
             </div>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className={`flex items-center gap-2 text-xs font-medium ${
            missingCount === 0 ? 'text-emerald-600' : 'text-amber-600'
          }`}>
             {missingCount === 0 ? (
               <>
                 <CheckCircle2 className="w-4 h-4" />
                 <span>Ready!</span>
               </>
             ) : (
               <>
                 <AlertCircle className="w-4 h-4" />
                 <span>{missingCount} missing</span>
               </>
             )}
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
