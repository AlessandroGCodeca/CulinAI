import React from 'react';
import { ChefHat, Search, MessageSquare, Clock, ShoppingCart, LogOut, Settings } from 'lucide-react';
import { ViewState, UserProfile, DietaryFilters } from '../types';

interface SidebarProps {
  viewState: ViewState;
  setViewState: (view: ViewState) => void;
  userProfile: UserProfile | null;
  favoritesCount?: number;
  shoppingCount?: number;
  onLogout?: () => void;
  onOpenSettings?: () => void;
  filters?: DietaryFilters;
  onToggleFilter?: (key: keyof DietaryFilters) => void;
  // NEW: Translations & Cuisines
  t: any;
  onToggleCuisine?: (cuisine: string) => void;
}

const cuisineOptions = [
  'Italian', 'Mexican', 'Indian', 'Chinese', 'Thai', 
  'Japanese', 'Mediterranean', 'American', 'French', 'Greek'
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  viewState, 
  setViewState, 
  userProfile, 
  favoritesCount = 0,
  shoppingCount = 0,
  onLogout,
  onOpenSettings,
  filters,
  onToggleFilter,
  t,
  onToggleCuisine
}) => {
  
  const menuItems = [
    { id: 'home', icon: Search, label: t.findRecipes || 'Find Recipes' },
    { id: 'chat', icon: MessageSquare, label: t.chefAi || 'Chef AI' },
    { id: 'history', icon: Clock, label: t.cookedHistory || 'Cooked History' },
    { id: 'shopping', icon: ShoppingCart, label: t.shoppingList || 'Shopping List', count: shoppingCount },
  ];

  return (
    <div className="fixed left-0 top-0 h-full bg-[#0B0F17] border-r border-slate-800 w-20 lg:w-64 transition-all duration-300 z-50 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
          <ChefHat className="w-6 h-6 text-white" />
        </div>
        <div className="hidden lg:block">
          <h1 className="font-bold text-xl text-white tracking-tight">CulinAI</h1>
          <p className="text-xs text-slate-500 font-medium">PREMIUM ASSISTANT</p>
        </div>
      </div>

      <div className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:block">
          {t.menu || 'Menu'}
        </div>
        {menuItems.map((item) => {
          const isActive = viewState === item.id || (item.id === 'home' && viewState === 'recipes');
          return (
            <button
              key={item.id}
              onClick={() => setViewState(item.id as ViewState)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'group-hover:text-emerald-400'}`} />
              <span className="hidden lg:block font-medium">{item.label}</span>
              {item.count ? (
                <span className="hidden lg:flex ml-auto bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {item.count}
                </span>
              ) : null}
            </button>
          );
        })}

        {/* RESTORED: Filters & Cuisines */}
        {filters && onToggleFilter && (
          <div className="mt-8 hidden lg:block space-y-6">
            
            {/* Dietary */}
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t.preferences || 'Preferences'}
              </div>
              <div className="space-y-1">
                {Object.entries(filters).map(([key, value]) => {
                  if (key === 'cuisine' || key === 'maxPrepTime') return null;
                  return (
                    <label key={key} className="flex items-center justify-between px-3 py-2 cursor-pointer group">
                      <span className="text-sm text-slate-400 group-hover:text-slate-200 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className={`w-9 h-5 rounded-full relative transition-colors ${value ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={value as boolean}
                          onChange={() => onToggleFilter(key as keyof DietaryFilters)}
                        />
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${value ? 'left-5' : 'left-1'}`} />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Cuisines (RESTORED) */}
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t.cuisines || 'Cuisines'}
              </div>
              <div className="px-3 flex flex-wrap gap-2">
                {cuisineOptions.map((cuisine) => {
                  const isActive = filters.cuisine.includes(cuisine);
                  return (
                    <button
                      key={cuisine}
                      onClick={() => onToggleCuisine && onToggleCuisine(cuisine)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {cuisine}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 space-y-2">
        {onOpenSettings && (
          <button 
             onClick={onOpenSettings}
             className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="hidden lg:block font-medium">{t.settings || 'Settings'}</span>
          </button>
        )}

        <button 
           onClick={onLogout}
           className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden lg:block font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
};
