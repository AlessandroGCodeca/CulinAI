import React from 'react';
import { X, Moon, Sun, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { Language } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  // RESTORED: This was missing, causing the build error
  setLanguage: (lang: Language) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, language, setLanguage }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Theme Section */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
              <Sun className="w-4 h-4" /> Theme
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950/50 p-1 rounded-xl">
              <button className="flex items-center justify-center gap-2 py-2 rounded-lg text-slate-400 hover:text-white transition-colors">
                <Sun className="w-4 h-4" /> Light Mode
              </button>
              <button className="flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 text-white shadow-sm">
                <Moon className="w-4 h-4" /> Dark Mode
              </button>
            </div>
          </div>

          {/* Language Section */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
              <Globe className="w-4 h-4" /> Language
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { code: 'en', label: 'English', flag: '🇺🇸' },
                { code: 'sk', label: 'Slovak', flag: '🇸🇰' },
                { code: 'es', label: 'Spanish', flag: '🇪🇸' },
                { code: 'de', label: 'German', flag: '🇩🇪' },
                { code: 'it', label: 'Italian', flag: '🇮🇹' },
                { code: 'fr', label: 'French', flag: '🇫🇷' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as Language)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    language === lang.code 
                      ? 'bg-emerald-500/10 border-emerald-500 text-white' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="font-medium">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
