import React from 'react';
import { ChefHat, ShoppingCart, Filter, Search, History, MessageSquare, Save, X, Sparkles, Globe, Settings, LogOut } from 'lucide-react';
import { DietaryFilters, ViewState, Language } from '../types';
import { TRANSLATIONS } from '../constants/translations';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  filters: DietaryFilters;
  onFilterChange: (key: keyof DietaryFilters) => void;
  onCuisineChange: (cuisine: string) => void;
  popularCuisines: string[];
  onSaveFilters: () => void;
  shoppingListCount: number;
  onClose?: () => void;
  isMobile?: boolean;
  onOpenSettings: () => void;
  language: Language;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  filters, 
  onFilterChange,
  onCuisineChange,
  popularCuisines,
  onSaveFilters,
  shoppingListCount,
  onClose,
  isMobile = false,
  onOpenSettings,
  language,
  onLogout
}) => {
  const t = TRANSLATIONS[language];

  const handleNavClick = (view: ViewState) => {
    onViewChange(view);
    if (isMobile && onClose) onClose();
  };

  const NavItem = ({ view, icon: Icon, label, badge }: { view: ViewState, icon: any, label: string, badge?: number }) => {
    const isActive = currentView === view;
    return (
        <button
          onClick={() => handleNavClick(view)}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
            isActive 
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/40 font-semibold ring-1 ring-emerald-400/20' 
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 font-medium'
          }`}
        >
          {isActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-transparent opacity-0 animate-fade-in" />
          )}
          <Icon size={20} className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-emerald-400'}`} strokeWidth={isActive ? 2.5 : 2} />
          <span className="relative z-10 tracking-wide text-sm">{label}</span>
          
          {badge !== undefined && badge > 0 && (
            <span className={`relative z-10 ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm transition-all ${
                isActive ? 'bg-white/20 text-white' : 'bg-emerald-500 text-white'
            }`}>
              {badge}
            </span>
          )}
        </button>
    );
  };

  return (
    <div className={`w-full ${isMobile ? 'h-full' : 'md:w-72 h-full'} bg-[#0B1120] text-slate-100 flex flex-col border-r border-slate-800/60 shadow-2xl z-50 overflow-hidden relative`}>
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-900 to-[#0B1120] pointer-events-none"></div>
      <div className="absolute -top-[20%] -right-[50%] w-[100%] h-[50%] bg-emerald-900/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="p-8 pb-6 flex justify-between items-center relative z-10">
        <div className="relative z-10">
            <h1 className="text-2xl font-black flex items-center gap-2.5 text-white tracking-tight">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-400 p-1.5 rounded-xl text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                    <ChefHat size={20} strokeWidth={2.5} />
                </div>
                CulinAI
            </h1>
            <p className="text-slate-500 text-[9px] font-extrabold tracking-[0.25em] uppercase mt-2.5 ml-1 opacity-60">Premium Assistant</p>
        </div>
        
        {isMobile && onClose && (
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full backdrop-blur-sm active:scale-95 hover:bg-white/10">
                <X size={20} />
            </button>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-800 relative z-10">
        <div className="mb-10">
            <h3 className="px-4 text-[11px] font-extrabold text-slate-600 uppercase tracking-widest mb-4">Menu</h3>
            <div className="space-y-1.5">
                <NavItem view="home" icon={Search} label={t.findRecipes} />
                <NavItem view="chat" icon={MessageSquare} label={t.chefAi} />
                <NavItem view="history" icon={History} label={t.cookedHistory} />
                <NavItem view="shopping" icon={ShoppingCart} label={t.shoppingList} badge={shoppingListCount} />
            </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60">
          <h3 className="px-4 text-[11px] font-extrabold text-slate-600 uppercase tracking-widest mb-5 flex items-center gap-2">
            <Filter size={12} className="text-emerald-500/50" />
            {t.preferences}
          </h3>
          <div className="space-y-1 px-1 mb-8">
            {Object.entries(filters).map(([key, value]) => {
              if (key === 'cuisine' || key === 'maxPrepTime') return null;
              return (
                <label key={key} className="flex items-center justify-between cursor-pointer group px-3 py-2.5 hover:bg-slate-800/40 rounded-xl transition-all">
                  <span className={`text-sm font-medium transition-colors ${value ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'}`}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  
                  <div className="relative shrink-0">
                    <input
                      type="checkbox"
                      checked={value as boolean}
                      onChange={() => onFilterChange(key as keyof DietaryFilters)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full transition-all duration-300 ${value ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-800 border border-slate-700'}`}></div>
                    <div className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-all duration-300 ${value ? 'translate-x-4 bg-white shadow-sm' : 'translate-x-0 bg-slate-500'}`}></div>
                  </div>
                </label>
              );
            })}
          </div>

          <h3 className="px-4 text-[11px] font-extrabold text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Globe size={12} className="text-emerald-500/50" />
            {t.cuisines}
          </h3>
          <div className="flex flex-wrap gap-2 px-2 pb-8">
             {popularCuisines.map(cuisine => {
                 const isSelected = filters.cuisine?.includes(cuisine);
                 return (
                     <button
                        key={cuisine}
                        onClick={() => onCuisineChange(cuisine)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                            isSelected 
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                            : 'bg-slate-800/30 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
                     >
                        {cuisine}
                     </button>
                 );
             })}
          </div>

          <div className="px-2 pb-4 space-y-2">
             <button 
                onClick={() => { onSaveFilters(); if(isMobile && onClose) onClose(); }}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-100 text-slate-900 rounded-xl text-sm font-bold transition-all hover:bg-white active:scale-95 shadow-lg shadow-white/5 hover:shadow-white/10"
            >
                <Save size={16} />
                {t.savePreferences}
            </button>
            
            <div className="grid grid-cols-4 gap-2">
                <button 
                    onClick={onOpenSettings}
                    className="col-span-3 flex items-center justify-center gap-2 py-3.5 bg-slate-800/50 text-slate-400 rounded-xl text-sm font-bold transition-all hover:bg-slate-800 hover:text-white active:scale-95 border border-slate-700/50"
                >
                    <Settings size={16} />
                    {t.settings}
                </button>
                <button 
                    onClick={onLogout}
                    className="col-span-1 flex items-center justify-center py-3.5 bg-red-900/20 text-red-400 rounded-xl transition-all hover:bg-red-900/40 active:scale-95 border border-red-900/30"
                    title={t.logout}
                >
                    <LogOut size={16} />
                </button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="p-6 bg-[#090e1a] border-t border-slate-800/60 relative z-10">
        <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-purple-500/20">
                <Sparkles size={14} className="text-white" />
            </div>
            <div>
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{t.poweredBy.split(' ')[0]} {t.poweredBy.split(' ')[1]}</p>
                <p className="text-xs font-bold text-slate-200">{t.poweredBy.split(' ').slice(2).join(' ')}</p>
            </div>
        </div>
      </div>
    </div>
  );
};