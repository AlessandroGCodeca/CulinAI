import React, { useState, useEffect } from 'react';
import { Clock, Flame, Image as ImageIcon, Upload, Loader2, Sparkles, Check, ChevronRight, Eye, Camera, ChevronLeft, AlertCircle, Globe, ExternalLink } from 'lucide-react';
import { Recipe } from '../types';
import { generateRecipeImage, fileToGenerativePart } from '../services/gemini';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  onUpdateImage: (id: string, imageUrl: string) => void;
  onAddUserImages?: (id: string, images: string[]) => void;
  onQuickView: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, onUpdateImage, onAddUserImages, onQuickView }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [displayImages, setDisplayImages] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const missingCount = recipe.missingIngredients.length;

  useEffect(() => {
    // Priority: User Images -> AI Image -> Placeholder
    const images = [];
    if (recipe.userImages && recipe.userImages.length > 0) {
        images.push(...recipe.userImages);
    }
    if (recipe.imageUrl) {
        images.push(recipe.imageUrl);
    }
    setDisplayImages(images);
    
    // If we're looking at an index that no longer exists (e.g. images removed), reset to 0
    // But if we add images, we generally want to start at 0 (user images) or keep position if valid.
    // For now, let's play safe and reset to 0 only if index is out of bounds or if user images changed significantly.
    // Actually, simply resetting to 0 on image change is a safe default for this UX.
    setActiveImageIndex(prev => {
        if (prev >= images.length) return 0;
        return prev; 
    });
  }, [recipe.imageUrl, recipe.userImages]);

  // Ensure active index is 0 when new images are added to highlight them
  useEffect(() => {
     if (recipe.userImages && recipe.userImages.length > 0) {
         // Optionally force view to first user image when uploaded
         // But checking logic inside the first useEffect is safer to prevent loops.
         // We'll rely on the logic above: if images array grows, we might want to see the new ones?
         // The previous logic reset it to 0. Let's keep it simple: if the image list changes length, reset to 0.
         setActiveImageIndex(0);
     }
  }, [recipe.userImages?.length]);


  // Clear error after 3 seconds
  useEffect(() => {
    if (uploadError) {
      const timer = setTimeout(() => setUploadError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadError]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); 
    setUploadError(null);
    const input = e.target;
    
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    const currentCount = recipe.userImages?.length || 0;
    const maxImages = 5;
    const remainingSlots = maxImages - currentCount;
    
    if (remainingSlots <= 0) {
        setUploadError("Limit reached.");
        input.value = ''; 
        return;
    }

    if (files.length > remainingSlots) {
         setUploadError(`Max ${remainingSlots} more.`);
         input.value = ''; 
         return;
    }

    try {
        const newImages = await Promise.all(files.map(fileToGenerativePart));
        const formattedImages = newImages.map(img => `data:image/jpeg;base64,${img}`);
        
        const updatedUserImages = [...(recipe.userImages || []), ...formattedImages];
        
        if (onAddUserImages) {
            onAddUserImages(recipe.id, updatedUserImages);
        }
    } catch (error) {
        console.error("Failed to process images", error);
        setUploadError("Upload failed.");
    } finally {
        input.value = ''; // Always reset input to allow re-uploading same file if needed
    }
  };

  const handleGenerateImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      const imageUrl = await generateRecipeImage(recipe.title);
      if (imageUrl) {
        onUpdateImage(recipe.id, imageUrl);
      } else {
        setUploadError("Failed to generate.");
      }
    } catch (error) {
      console.error(error);
      setUploadError("Error generating.");
    } finally {
      setIsGenerating(false);
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const hasUserImages = recipe.userImages && recipe.userImages.length > 0;
  // Determine if the current visible image is a user-uploaded one.
  // User images are at the beginning of the displayImages array.
  const isUserImageActive = hasUserImages && activeImageIndex < (recipe.userImages?.length || 0);

  // Helper to extract hostname if sourceName is missing
  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return null;
    }
  };

  const displaySource = recipe.sourceName || (recipe.sourceUrl ? getHostname(recipe.sourceUrl) : null);

  return (
    <div 
      onClick={onClick}
      className={`group relative flex flex-col h-full bg-white rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-2 cursor-pointer
      ${recipe.cooked 
        ? 'ring-2 ring-emerald-500/30 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.2)]' 
        : hasUserImages 
          ? 'ring-1 ring-emerald-500/20 shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]' 
          : 'border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]'
      }`}
    >
      <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden shrink-0">
        {/* Error Toast */}
        {uploadError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg animate-fade-in flex items-center gap-1.5 whitespace-nowrap">
            <AlertCircle size={10} />
            {uploadError}
          </div>
        )}

        {displayImages.length > 0 ? (
            <div className="w-full h-full relative group/image">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                
                <img 
                    src={displayImages[activeImageIndex]} 
                    alt={recipe.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />

                {/* User Photo Badge */}
                {isUserImageActive && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-emerald-900 text-[9px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm z-20 border border-emerald-100 animate-fade-in">
                        <Camera size={10} className="text-emerald-600" />
                        <span>User Photo</span>
                    </div>
                )}
                
                {/* Carousel Controls */}
                {displayImages.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-20 hover:scale-110 border border-white/10"
                    >
                      <ChevronLeft size={16} strokeWidth={3} />
                    </button>
                    <button 
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-20 hover:scale-110 border border-white/10"
                    >
                      <ChevronRight size={16} strokeWidth={3} />
                    </button>
                    
                    {/* Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {displayImages.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setActiveImageIndex(idx); }}
                                className={`h-1.5 rounded-full transition-all shadow-sm ${idx === activeImageIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5 hover:bg-white/80'}`}
                            />
                        ))}
                    </div>
                  </>
                )}
            </div>
        ) : (
            <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-300 relative overflow-hidden group-hover:bg-slate-100 transition-colors">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                 <div className="p-5 bg-white rounded-full shadow-sm relative z-10 mb-3 border border-slate-100 group-hover:scale-110 transition-transform duration-500">
                     <ImageIcon size={24} className="text-slate-300" />
                 </div>
                 <span className="text-[10px] font-bold tracking-widest uppercase relative z-10 text-slate-400">No Image</span>
            </div>
        )}
        
        {/* Cooked Badge */}
        <div className="absolute top-3 left-3 md:top-4 md:left-4 flex flex-col gap-2 z-20">
            {recipe.cooked && (
                <div className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 md:px-3 md:py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 animate-fade-in border border-emerald-400/50">
                    <div className="bg-white rounded-full p-0.5">
                        <Check size={8} strokeWidth={4} className="text-emerald-600" /> 
                    </div>
                    <span className="uppercase tracking-widest text-shadow-sm">Cooked</span>
                </div>
            )}
        </div>

        {/* Floating Actions */}
        <div className={`absolute top-3 right-3 md:top-4 md:right-4 flex gap-2 z-20 transition-all duration-300 ${displayImages.length > 0 ? 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0' : 'opacity-100'}`}>
             <button 
                onClick={(e) => { e.stopPropagation(); onQuickView(); }}
                className="p-2 md:p-2.5 bg-white/90 backdrop-blur-md rounded-full text-slate-600 hover:text-indigo-600 hover:scale-105 transition-all shadow-lg cursor-pointer active:scale-95 border border-white/20"
                title="Quick View"
            >
                <Eye size={14} className="md:w-4 md:h-4" strokeWidth={2.5} />
            </button>

             <label 
                className={`p-2 md:p-2.5 bg-white/90 backdrop-blur-md rounded-full text-slate-600 hover:text-emerald-600 hover:scale-105 transition-all shadow-lg cursor-pointer active:scale-95 border border-white/20 relative ${isUserImageActive ? 'hidden' : ''}`}
                onClick={(e) => e.stopPropagation()}
                title="Upload Image (Max 5)"
            >
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
                <Upload size={14} className="md:w-4 md:h-4" strokeWidth={2.5} />
                {(recipe.userImages?.length || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold border border-white">
                        {recipe.userImages?.length}
                    </span>
                )}
            </label>
            <button 
                onClick={handleGenerateImage}
                disabled={isGenerating}
                className={`p-2 md:p-2.5 bg-emerald-500/90 backdrop-blur-md rounded-full text-white hover:bg-emerald-500 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 border border-emerald-400/20 ${isUserImageActive ? 'hidden' : ''}`}
                title="Generate Image with AI"
            >
                {isGenerating ? <Loader2 size={14} className="md:w-4 md:h-4 animate-spin" /> : <Sparkles size={14} className="md:w-4 md:h-4" strokeWidth={2.5} />}
            </button>
        </div>

        {/* Dietary Tags */}
        <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 flex gap-1 pointer-events-none z-20">
          {recipe.dietaryTags.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="bg-black/40 backdrop-blur-md text-white text-[9px] md:text-[10px] px-2 py-0.5 md:px-2.5 md:py-1 rounded-full font-bold shadow-sm tracking-wide border border-white/10">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="p-4 md:p-6 flex flex-col flex-1 relative bg-white">
        <h3 className="font-extrabold text-lg md:text-xl leading-snug text-slate-800 mb-2 md:mb-3 group-hover:text-emerald-700 transition-colors line-clamp-2 tracking-tight">
          {recipe.title}
        </h3>

        {/* Source Link Badge */}
        {displaySource && (
            <div className="mb-3 -mt-1 flex">
              {recipe.sourceUrl ? (
                <a 
                    href={recipe.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 text-[10px] font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors border border-slate-100 shadow-sm max-w-full"
                    title={recipe.sourceUrl}
                >
                    <Globe size={10} className="shrink-0" />
                    <span className="truncate max-w-[150px]">{displaySource}</span>
                    <ExternalLink size={8} className="opacity-50 shrink-0" />
                </a>
              ) : (
                <div 
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 text-[10px] font-bold text-slate-500 border border-slate-100 shadow-sm max-w-full"
                    title={displaySource}
                >
                    <Globe size={10} className="shrink-0" />
                    <span className="truncate max-w-[150px]">{displaySource}</span>
                </div>
              )}
            </div>
        )}
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6 mt-auto">
           <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg border border-slate-100/50">
             <Clock size={12} className="md:w-3.5 md:h-3.5 text-emerald-500" />
             {recipe.prepTime}
           </div>
           <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg border border-slate-100/50">
             <Flame size={12} className="md:w-3.5 md:h-3.5 text-orange-500" />
             {recipe.calories}
           </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 md:pt-5 border-t border-slate-50 mt-auto group/footer">
            {missingCount > 0 ? (
            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-amber-100/50 max-w-[70%]">
                <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-full w-full bg-amber-500"></span>
                </span>
                <span className="truncate">Missing {missingCount}</span>
            </div>
            ) : (
            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-emerald-100/50">
                <Check size={10} className="md:w-3 md:h-3 text-emerald-600" strokeWidth={3} />
                <span className="truncate">Ready!</span>
            </div>
            )}
            
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 group-hover:shadow-md group-hover:shadow-emerald-500/30 group-hover:scale-110">
                <ChevronRight size={16} className="md:w-[18px]" strokeWidth={2.5} />
            </div>
        </div>
      </div>
    </div>
  );
};