import React, { useState } from 'react';
import { ChefHat, Lock, User, ArrowRight, Key } from 'lucide-react';
import { Language, UserProfile } from '../types';
import { TRANSLATIONS } from '../constants/translations';

interface AuthScreenProps {
  language: Language;
  onRegister: (profile: UserProfile) => void;
  onLogin: (key: string) => void;
  existingProfile: UserProfile | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ 
  language, 
  onRegister, 
  onLogin, 
  existingProfile 
}) => {
  const t = TRANSLATIONS[language];
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    if (existingProfile) {
        // Login Mode
        if (key === existingProfile.secretKey) {
            onLogin(key);
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    } else {
        // Register Mode
        if (name.trim()) {
            onRegister({ name: name.trim(), secretKey: key.trim() });
        }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-xl">
      {/* Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[20%] right-[20%] w-[50%] h-[50%] bg-teal-500/20 rounded-full blur-[100px] animate-float"></div>
      </div>

      <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl shadow-emerald-500/10 border border-white/20 dark:border-slate-800 p-8 md:p-12 relative z-10 animate-scale-in">
        <div className="flex justify-center mb-8">
            <div className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-xl shadow-emerald-500/30 text-white transform -rotate-3">
                <ChefHat size={48} strokeWidth={1.5} />
            </div>
        </div>

        <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2">
                {existingProfile ? `${t.welcomeBack}, ${existingProfile.name}` : t.welcome}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
                {existingProfile ? t.login : t.setupProfile}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            {!existingProfile && (
                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                        <User size={20} />
                    </div>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.yourName}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-950 transition-all font-bold text-slate-800 dark:text-white placeholder:text-slate-400"
                        required
                    />
                </div>
            )}

            <div className="relative group">
                <div className={`absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors ${error ? 'text-red-500' : 'text-slate-400 group-focus-within:text-emerald-500'}`}>
                    <Key size={20} />
                </div>
                <input 
                    type="password" 
                    value={key}
                    onChange={(e) => { setKey(e.target.value); setError(false); }}
                    placeholder={existingProfile ? t.enterKey : t.secretKey}
                    className={`w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl focus:outline-none transition-all font-bold text-slate-800 dark:text-white placeholder:text-slate-400 ${
                        error 
                        ? 'border-red-300 focus:border-red-500 bg-red-50 dark:bg-red-900/10 animate-shimmer' 
                        : 'border-slate-100 dark:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-950'
                    }`}
                    required
                />
            </div>

            <button 
                type="submit"
                className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 mt-4"
            >
                {existingProfile ? (
                    <>
                        <Lock size={20} /> {t.unlock}
                    </>
                ) : (
                    <>
                        {t.createProfile} <ArrowRight size={20} />
                    </>
                )}
            </button>
        </form>
      </div>
    </div>
  );
};