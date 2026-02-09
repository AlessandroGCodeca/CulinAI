import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Volume2, X, Check, ShoppingBag, Loader2, Sparkles, Pause, Clock, List, AlertCircle } from 'lucide-react';
import { Recipe } from '../types';
import { generateSpeech } from '../services/gemini';

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
  onAddToShoppingList: (items: string[]) => void;
  onFinish: () => void;
}

export const CookingMode: React.FC<CookingModeProps> = ({ recipe, onClose, onAddToShoppingList, onFinish }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const isHandsFreeRef = useRef(isHandsFree);
  const currentStepRef = useRef(currentStep);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isHandsFreeRef.current = isHandsFree;
    if (!isHandsFree) {
        setError(null);
    }
  }, [isHandsFree]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    return () => {
      stopAudio();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (isWaiting) {
      timeoutRef.current = setTimeout(() => {
        setIsWaiting(false);
        setCurrentStep(prev => prev + 1);
      }, 3000); 
      
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [isWaiting]);

  useEffect(() => {
    if (isHandsFree) {
        // Clear any existing errors when moving to a new step in hands-free mode
        setError(null);
        const timer = setTimeout(() => {
            playAudio(recipe.instructions[currentStep]);
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [currentStep, isHandsFree, recipe.instructions]);

  const stopAudio = () => {
    if (sourceNodeRef.current) {
        try {
            sourceNodeRef.current.stop();
        } catch (e) {
            // Ignore stop errors if already stopped
        }
        sourceNodeRef.current = null;
    }
    setIsPlaying(false);
    setIsWaiting(false); 
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const playAudio = async (text: string) => {
    stopAudio(); 
    setError(null);
    
    setIsLoadingAudio(true);
    try {
      const audioData = await generateSpeech(text);
      if (!audioData) throw new Error("Could not generate voice guidance. Please check your connection.");

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        if (isHandsFreeRef.current) {
             if (currentStepRef.current < recipe.instructions.length - 1) {
                 setIsWaiting(true);
             } else {
                 setIsHandsFree(false);
             }
        }
      };
      
      sourceNodeRef.current = source;
      source.start(0);
      setIsPlaying(true);
    } catch (err) {
      console.error("Audio playback error", err);
      setIsHandsFree(false); 
      setIsPlaying(false);
      setError("Voice guidance unavailable. Please try again.");
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const toggleAudio = () => {
    if (isPlaying) {
        stopAudio();
        setIsHandsFree(false); 
    } else {
        playAudio(recipe.instructions[currentStep]);
    }
  };

  const toggleHandsFree = () => {
      const newValue = !isHandsFree;
      setIsHandsFree(newValue);
      
      if (newValue && !isPlaying && !isWaiting) {
          playAudio(recipe.instructions[currentStep]);
      } 
      else if (!newValue) {
          stopAudio();
      }
  };

  const handleNext = () => {
    stopAudio();
    if (currentStep < recipe.instructions.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    stopAudio();
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const progress = ((currentStep + 1) / recipe.instructions.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-slate-100 shadow-sm relative z-20">
        <div className="flex items-center gap-6 flex-1">
          <button 
            onClick={onClose}
            className="p-3.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-800"
          >
            <X size={24} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-xl md:text-2xl text-slate-900 truncate tracking-tight">{recipe.title}</h2>
            <div className="flex items-center gap-2 mt-1">
                {isHandsFree && (
                    <span className="flex items-center gap-1.5 text-[10px] font-black bg-purple-100 text-purple-600 px-3 py-1 rounded-full animate-pulse tracking-wide uppercase">
                        <Sparkles size={10} fill="currentColor" /> Hands-Free Active
                    </span>
                )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <button
                onClick={() => setShowIngredients(!showIngredients)}
                className={`p-3.5 rounded-2xl transition-all border ${
                    showIngredients ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Toggle Ingredients"
            >
                <List size={22} />
            </button>

            <button
                onClick={toggleHandsFree}
                className={`flex items-center gap-2.5 text-sm font-bold px-5 py-3.5 rounded-2xl transition-all border shadow-sm active:scale-95 ${
                    isHandsFree 
                    ? 'bg-purple-600 border-purple-600 text-white shadow-purple-200' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
            >
                <Sparkles size={18} className={isHandsFree ? "fill-white text-white" : "text-purple-500"} />
                <span className="hidden sm:inline">Hands-Free</span>
            </button>

            {recipe.missingIngredients.length > 0 && (
            <button 
                onClick={() => {
                    onAddToShoppingList(recipe.missingIngredients.map(i => `${i.quantity} ${i.name}`));
                    alert("Added missing ingredients to shopping list!");
                }}
                className="flex items-center gap-2 text-sm font-bold text-white bg-emerald-600 px-5 py-3.5 rounded-2xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 active:scale-95"
            >
                <ShoppingBag size={18} />
                <span className="hidden sm:inline">Add Missing</span>
            </button>
            )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-200 w-full relative z-10">
        <div 
          className="h-full bg-emerald-500 transition-all duration-700 ease-out relative shadow-[0_0_15px_rgba(16,185,129,0.5)]"
          style={{ width: `${progress}%` }}
        >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-4 border-emerald-500 rounded-full shadow-lg scale-125"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
          
          {/* Main Steps Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 max-w-6xl mx-auto w-full relative overflow-y-auto">
            {/* Step Indicator */}
            <div className="w-full text-center mb-16 animate-fade-in relative max-w-4xl mx-auto">
                {error && (
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap bg-red-50 text-red-600 px-6 py-3 rounded-2xl shadow-xl border border-red-100 flex items-center gap-3 animate-slide-up">
                        <AlertCircle size={20} />
                        <span className="text-sm font-bold">{error}</span>
                        <button onClick={() => setError(null)} className="ml-2 hover:bg-red-100 p-1.5 rounded-full transition-colors"><X size={16}/></button>
                    </div>
                )}

                <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-400 font-black mb-10 text-xs tracking-[0.2em] uppercase">
                    Step <span className="text-emerald-600 text-base">{currentStep + 1}</span> of {recipe.instructions.length}
                </div>
                
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-800 leading-tight tracking-tight drop-shadow-sm">
                    {recipe.instructions[currentStep]}
                </h1>
            </div>

            <div className="flex flex-col items-center gap-10 animate-slide-up">
                {/* Audio Control */}
                <button 
                    onClick={toggleAudio}
                    disabled={isLoadingAudio}
                    className={`flex items-center gap-5 px-12 py-6 rounded-full text-xl font-bold transition-all shadow-2xl hover:shadow-3xl hover:-translate-y-1 active:scale-95 active:translate-y-0 ${
                        isPlaying 
                        ? 'bg-amber-100 text-amber-700 ring-8 ring-amber-500/10' 
                        : isWaiting 
                            ? 'bg-purple-100 text-purple-700 ring-8 ring-purple-500/10'
                            : 'bg-slate-900 text-white hover:bg-slate-800 ring-8 ring-slate-200'
                    } disabled:opacity-70 disabled:cursor-wait`}
                >
                    {isLoadingAudio ? (
                        <Loader2 className="animate-spin w-8 h-8" />
                    ) : isPlaying ? (
                        <Pause className="w-8 h-8 fill-current" />
                    ) : isWaiting ? (
                        <Clock className="animate-pulse w-8 h-8" />
                    ) : (
                        <Volume2 className="w-8 h-8" />
                    )}
                    
                    {isLoadingAudio ? "Loading Voice..." : 
                    isPlaying ? "Pause Reading" : 
                    isWaiting ? "Next Step..." : 
                    "Read Step"}
                </button>

                {/* Auto Advance Indicator */}
                {isWaiting && (
                    <div className="w-80 bg-white p-5 rounded-3xl shadow-xl border border-purple-100 animate-scale-in">
                        <div className="flex justify-between text-xs text-purple-600 font-black uppercase tracking-wider mb-3">
                            <span>Auto-Advancing</span>
                            <span>3s</span>
                        </div>
                        <div className="h-4 bg-purple-50 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 animate-[progress_3s_linear_forwards] origin-left"></div>
                        </div>
                        <style>{`
                            @keyframes progress {
                                from { width: 0%; }
                                to { width: 100%; }
                            }
                        `}</style>
                    </div>
                )}
                
                {!isWaiting && isPlaying && isHandsFree && (
                    <p className="text-sm text-purple-600 font-bold animate-pulse tracking-wide uppercase bg-purple-50 px-6 py-2.5 rounded-full border border-purple-100">
                        Listening...
                    </p>
                )}
            </div>
          </div>

          {/* Ingredients Side Panel */}
          <div className={`absolute md:relative inset-y-0 right-0 w-80 md:w-96 bg-white/95 backdrop-blur-2xl shadow-2xl border-l border-slate-100 transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) z-30 overflow-y-auto ${showIngredients ? 'translate-x-0' : 'translate-x-full md:hidden'}`}>
             <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                   <h3 className="font-black text-2xl text-slate-900 tracking-tight">Ingredients</h3>
                   <button onClick={() => setShowIngredients(false)} className="md:hidden p-2.5 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors">
                       <X size={20} />
                   </button>
                </div>
                <div className="space-y-6">
                    {recipe.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex justify-between items-start py-4 border-b border-slate-100 last:border-0 group">
                            <span className="text-slate-700 font-bold text-lg leading-snug">{ing.name}</span>
                            <span className="text-slate-500 font-bold text-right pl-4 bg-slate-50 px-3 py-1 rounded-xl text-sm">{ing.quantity}</span>
                        </div>
                    ))}
                </div>
             </div>
          </div>

      </div>

      {/* Navigation Footer */}
      <div className="p-8 md:p-10 border-t border-slate-200 flex justify-between items-center bg-white z-20 shadow-[0_-10px_60px_-15px_rgba(0,0,0,0.1)]">
        <button 
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="flex items-center gap-3 text-slate-500 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:text-emerald-600 transition-colors px-8 py-4 hover:bg-slate-50 rounded-2xl"
        >
          <ChevronLeft size={32} strokeWidth={2.5} />
          <span className="text-xl">Previous</span>
        </button>
        
        {/* Step Indicators (Dots) */}
        <div className="hidden md:flex items-center gap-3 overflow-hidden px-10">
            {recipe.instructions.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`rounded-full transition-all duration-500 ${
                        idx === currentStep 
                            ? 'w-5 h-5 bg-emerald-500 scale-110 shadow-lg shadow-emerald-200' 
                            : idx < currentStep 
                                ? 'w-3 h-3 bg-emerald-200' 
                                : 'w-2.5 h-2.5 bg-slate-200'
                    }`}
                />
            ))}
        </div>

        {currentStep === recipe.instructions.length - 1 ? (
            <button 
            onClick={onFinish}
            className="flex items-center gap-4 bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-emerald-500/30 hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95"
          >
            <Check size={32} strokeWidth={3} />
            Finish Cooking
          </button>
        ) : (
          <button 
            onClick={handleNext}
            className="flex items-center gap-4 bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
          >
            Next Step
            <ChevronRight size={32} strokeWidth={3} />
          </button>
        )}
      </div>
    </div>
  );
};