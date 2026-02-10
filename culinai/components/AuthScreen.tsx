import React, { useState } from 'react';
import { ChefHat, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthScreenProps {
  onLogin: (name: string, secretKey: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      // If no key is provided, generate a random one for session
      const finalKey = key.trim() || Math.random().toString(36).substring(7);
      onLogin(name, finalKey);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
              <ChefHat className="w-10 h-10 text-emerald-500" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to CulinAI</h1>
            <p className="text-slate-400">Your intelligent culinary companion</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Chef Gordon"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Secret Key (Optional)</label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl px-4 py-4 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Start Cooking</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Sparkles className="w-4 h-4" />
            <span>Powered by Gemini 2.0 Flash</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
