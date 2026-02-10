import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle2, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Recipe } from '../types';

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
  onComplete: () => void;
}

export const CookingMode: React.FC<CookingModeProps> = ({ recipe, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [timers, setTimers] = useState<{[key: number]: number}>({});

  const toggleTimer = (stepIndex: number) => {
    // Simple mock timer for now
    if (timers[stepIndex]) {
      const newTimers = { ...timers };
      delete newTimers[stepIndex];
      setTimers(newTimers);
    } else {
      setTimers({ ...timers, [stepIndex]: 300 }); // Default 5 mins
    }
  };

  const handleFinish = () => {
    // Removed confetti dependency to fix build
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0F17] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-700">
             {recipe.image && <img src={recipe.image} alt="" className="w-full h-full object-cover" />}
           </div>
           <div>
             <h2 className="text-white font-bold truncate max-w-[200px] sm:max-w-md">{recipe.title}</h2>
             <p className="text-slate-400 text-sm">Step {currentStep + 1} of {recipe.instructions.length}</p>
           </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl w-full"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                 <div 
                   className="h-full bg-emerald-500 transition-all duration-500"
                   style={{ width: `${((currentStep + 1) / recipe.instructions.length) * 100}%` }}
                 />
               </div>
               
               <h3 className="text-emerald-500 font-bold tracking-wider uppercase text-sm mb-4">
                 Step {currentStep + 1}
               </h3>
               
               <p className="text-2xl sm:text-3xl text-white font-medium leading-relaxed mb-8">
                 {recipe.instructions[currentStep]}
               </p>

               <div className="flex gap-3">
                 <button 
                   onClick={() => toggleTimer(currentStep)}
                   className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                     timers[currentStep] 
                       ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                       : 'border-slate-700 text-slate-400 hover:border-slate-500'
                   }`}
                 >
                   <Timer className="w-4 h-4" />
                   <span>{timers[currentStep] ? '05:00' : 'Start Timer'}</span>
                 </button>
               </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <div className="p-6 border-t border-slate-800 flex justify-between max-w-4xl mx-auto w-full">
        <button
          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
          className="px-6 py-3 rounded-xl font-medium text-slate-300 disabled:opacity-30 hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        {currentStep === recipe.instructions.length - 1 ? (
           <button
             onClick={handleFinish}
             className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
           >
             Finish Cooking
             <CheckCircle2 className="w-5 h-5" />
           </button>
        ) : (
           <button
             onClick={() => setCurrentStep(prev => Math.min(recipe.instructions.length - 1, prev + 1))}
             className="px-8 py-3 bg-white text-slate-900 hover:bg-slate-200 rounded-xl font-bold transition-colors flex items-center gap-2"
           >
             Next Step
             <ChevronRight className="w-5 h-5" />
           </button>
        )}
      </div>
    </div>
  );
};
