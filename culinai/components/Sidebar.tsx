import React from 'react';
import { ChefHat, Search, MessageSquare, Clock, ShoppingCart, LogOut, Settings } from 'lucide-react';
import { ViewState, UserProfile } from '../types';

interface SidebarProps {
  viewState: ViewState;
  setViewState: (view: ViewState) => void;
  userProfile: UserProfile | null;
  favoritesCount?: number;
  shoppingCount?: number;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  viewState, 
  setViewState, 
  userProfile, 
  favoritesCount = 0,
  shoppingCount = 0,
  onLogout 
}) => {
  
  const menuItems = [
    { id: 'home', icon: Search, label: 'Find Recipes' }, // Mapped 'home' to Find Recipes for simplicity
    { id: 'chat', icon: MessageSquare, label: 'Chef AI' },
    { id: 'history', icon: Clock, label: 'Cooked History' },
    { id: 'shopping', icon: ShoppingCart, label: 'Shopping List', count: shoppingCount },
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

      <div className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:block">
          Menu
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
      </div>

      <div className="p-4 border-t border-slate-800 space-y-2">
        {userProfile && (
           <div className="hidden lg:flex items-center gap-3 px-3 py-2 bg-slate-900 rounded-xl border border-slate-800 mb-2">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
               {userProfile.name.charAt(0)}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-medium text-white truncate">{userProfile.name}</p>
               <p className="text-xs text-emerald-500">Pro Chef</p>
             </div>
           </div>
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
