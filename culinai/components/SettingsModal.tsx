import React from 'react';
import { X, Moon, Sun, Languages, Check } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'sk', label: 'Slovak', flag: '🇸🇰' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  onLanguageChange,
  isDarkMode,
  toggleTheme,
}) => {
  if (!isOpen) return null;
  
  const t = TRANSLATIONS[language];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden relative z-10 animate-scale-in border border-slate-100 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t.settings}</h2>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Theme Section */}
          <div>
            <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Sun size={14} /> {t.theme}
            </h3>
            <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex relative">
               <button
                 onClick={() => isDarkMode && toggleTheme()}
                 className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 ${!isDarkMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
               >
                 <Sun size={18} /> {t.lightMode}
               </button>
               <button
                 onClick={() => !isDarkMode && toggleTheme()}
                 className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 ${isDarkMode ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
               >
                 <Moon size={18} /> {t.darkMode}
               </button>
            </div>
          </div>

          {/* Language Section */}
          <div>
            <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Languages size={14} /> {t.language}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onLanguageChange(lang.code)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    language === lang.code
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-600'
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="font-bold text-sm">{lang.label}</span>
                  {language === lang.code && <Check size={16} className="ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800">
           <button 
             onClick={onClose}
             className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl hover:opacity-90 transition-opacity"
           >
             {t.close}
           </button>
        </div>
      </div>
    </div>
  );
};