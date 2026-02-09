import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Loader2, Sparkles, ChefHat } from 'lucide-react';
import { Chat } from '@google/genai';
import { createChefChat } from '../services/gemini';
import { ChatMessage } from '../types';

interface ChatBotProps {
  initialMessage?: string;
  onClearInitialMessage?: () => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({ initialMessage, onClearInitialMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasProcessedInitial = useRef(false);

  // Define sendMessage outside useEffect to be accessible
  const sendMessage = async (text: string) => {
    if (!text.trim() || !chatSessionRef.current) return;

    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsLoading(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: text });
      const responseText = result.text || "I'm sorry, I couldn't generate a response.";
      
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, something went wrong. Please try again.", isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initialize chat session
    chatSessionRef.current = createChefChat();
    
    // Initial welcome message
    const welcomeText = initialMessage 
        ? "Hello! I'm ready to help with your cooking question."
        : "Hello! I am your AI Chef assistant. Ask me anything about recipes, cooking techniques, or ingredient substitutions!";
        
    setMessages([{ role: 'model', text: welcomeText }]);

    // Handle initial message passed via props
    if (initialMessage && !hasProcessedInitial.current) {
        hasProcessedInitial.current = true;
        setTimeout(() => {
            sendMessage(initialMessage);
            if (onClearInitialMessage) onClearInitialMessage();
        }, 500);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
        const text = input.trim();
        setInput('');
        sendMessage(text);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[800px] max-w-5xl mx-auto w-full bg-slate-50 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200/60 relative my-4 md:my-8">
      {/* Header */}
      <div className="px-6 py-5 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                <ChefHat className="text-white" size={24} strokeWidth={2.5} />
            </div>
            <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Chef AI</h2>
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Online</p>
                </div>
            </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-50 scroll-smooth">
         {messages.map((msg, idx) => (
             <div 
                key={idx} 
                className={`flex gap-4 md:gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-slide-up`}
             >
                 {/* Avatar */}
                 <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border-2 ${
                     msg.role === 'user' 
                     ? 'bg-white border-slate-100' 
                     : 'bg-gradient-to-br from-emerald-500 to-teal-600 border-transparent'
                 }`}>
                     {msg.role === 'user' 
                        ? <User size={20} className="text-slate-400" /> 
                        : <Sparkles size={20} className="text-white" />
                     }
                 </div>

                 {/* Bubble */}
                 <div className={`flex flex-col max-w-[80%] md:max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-6 py-4 md:px-8 md:py-6 shadow-sm relative group transition-all duration-200 hover:shadow-md ${
                        msg.role === 'user'
                        ? 'bg-slate-900 text-white rounded-[2rem] rounded-tr-sm'
                        : msg.isError 
                            ? 'bg-red-50 text-red-800 border border-red-100 rounded-[2rem] rounded-tl-sm'
                            : 'bg-white text-slate-600 border border-slate-100 rounded-[2rem] rounded-tl-sm'
                    }`}>
                        <p className={`text-[15px] md:text-base leading-relaxed font-medium whitespace-pre-wrap ${msg.role === 'user' ? 'text-slate-100' : 'text-slate-600'}`}>
                            {msg.text}
                        </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 mt-2 px-2 uppercase tracking-widest animate-fade-in">
                        {msg.role === 'user' ? 'You' : 'Chef'}
                    </span>
                 </div>
             </div>
         ))}
         
         {isLoading && (
             <div className="flex gap-4 md:gap-6 animate-fade-in">
                 <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
                     <Loader2 size={20} className="text-white animate-spin" />
                 </div>
                 <div className="bg-white px-8 py-6 rounded-[2rem] rounded-tl-sm shadow-sm border border-slate-100 flex items-center gap-3">
                     <div className="flex space-x-1.5">
                         <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                         <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                         <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                     </div>
                 </div>
             </div>
         )}
         <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="relative flex items-end gap-3 max-w-4xl mx-auto">
            <div className="relative flex-1 group">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about ingredients, techniques..."
                    className="w-full pl-6 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-700 font-medium text-lg placeholder:text-slate-400"
                />
            </div>
            <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-600/20 active:scale-95 hover:shadow-xl hover:-translate-y-0.5"
            >
                <Send size={24} strokeWidth={2.5} />
            </button>
        </form>
      </div>
    </div>
  );
};