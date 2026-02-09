import React from 'react';
import { X, Clock, Flame, ChefHat, Check, ArrowRight, ExternalLink } from 'lucide-react';
import { Recipe } from '../types';

interface QuickViewModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ recipe, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative z-10 animate-slide-up">
        {/* Header */}
        <div className="relative h-32 sm:h-40 shrink-0 bg-slate-100 overflow-hidden">
            {recipe.imageUrl ? (
                <>
                    <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                </>
            ) : (
                <div className="w-full h-full bg-slate-800 relative">
                     <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                     <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-purple-500/20"></div>
                </div>
            )}
            
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors z-20"
            >
                <X size={20} />
            </button>

            <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight shadow-black drop-shadow-md">{recipe.title}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg text-white/90 text-xs font-bold border border-white/10">
                        <Clock size={12} className="text-emerald-300" /> {recipe.prepTime}
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg text-white/90 text-xs font-bold border border-white/10">
                        <Flame size={12} className="text-orange-300" /> {recipe.calories}
                    </div>
                    {recipe.dietaryTags.slice(0, 3).map((tag, i) => (
                       <span key={i} className="px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                           {tag}
                       </span>
                   ))}
                </div>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 scroll-smooth">
            {/* Ingredients */}
            <div>
                <h3 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                        <ChefHat size={16} />
                    </div>
                    Ingredients
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    {recipe.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-600 py-1 border-b border-slate-50 last:border-0">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span className="font-bold text-slate-800">{ing.name}</span>
                            <span className="text-slate-400 ml-auto tabular-nums font-medium">{ing.quantity}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Instructions Preview */}
            <div>
                <h3 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                        <ArrowRight size={16} />
                    </div>
                    Instructions
                </h3>
                <div className="space-y-4">
                    {recipe.instructions.map((step, i) => (
                        <div key={i} className="flex gap-4 group">
                            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors text-xs font-bold mt-0.5">
                                {i + 1}
                            </span>
                            <p className="text-sm leading-relaxed text-slate-600 font-medium">
                                {step}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            {recipe.sourceUrl && (
                <a 
                    href={recipe.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mr-auto px-4 py-2.5 text-slate-500 font-bold hover:text-emerald-600 text-sm flex items-center gap-2 transition-colors hover:bg-slate-100 rounded-xl"
                >
                    Visit Source <ExternalLink size={14} />
                </a>
            )}
            <button 
                onClick={onClose}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 active:scale-95 transition-all text-sm shadow-sm hover:shadow-md"
            >
                Close Preview
            </button>
        </div>
      </div>
    </div>
  );
};