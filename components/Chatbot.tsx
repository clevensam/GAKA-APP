
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Module } from '../types';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotProps {
  modules: Module[];
  onNavigate: (view: any, module?: Module) => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({ modules, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm Juliana, your academic assistant. How can I help you today? 😊" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateContext = () => {
    let context = "Here is the current content of the GAKA Academic Resource Hub:\n\n";
    modules.forEach(m => {
      context += `Module: ${m.name} (${m.code})\n`;
      context += `Description: ${m.description}\n`;
      context += `Resources available:\n`;
      m.resources.forEach(r => {
        context += `- ${r.title} (${r.type})\n`;
      });
      context += "\n";
    });
    return context;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const systemInstruction = `
        You are Juliana, a polite, helpful, and instructor-like female academic assistant for GAKA (Academic Resource Hub).
        Your personality: Professional, encouraging, and clear. Use emojis to keep the conversation friendly.
        
        Your primary goal is to help Computer Science students at MUST find resources.
        
        ${generateContext()}
        
        Instructions:
        1. Answer questions based on the provided module and resource data.
        2. If a student asks for a specific module, you can mention its code (e.g., CS101).
        3. If a student asks for their saved resources, mention the 'Saved' section.
        4. Always be polite and use a "teacher-like" tone.
        5. If you don't know the answer, politely say so and suggest they explore the 'Modules' section.
        6. Keep responses concise but helpful.
      `;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const chatHistory = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...chatHistory,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const botResponse = response.text || "I'm sorry, I couldn't process that. Could you try again? 😅";
      setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);

    } catch (error: any) {
      console.error("Chat Error:", error);
      
      const errorStr = error.message || String(error);
      let errorMessage = `I encountered an error: "${errorStr}". 🛠️`;

      if (!process.env.GEMINI_API_KEY) {
        errorMessage = "The GEMINI_API_KEY is missing from the environment variables. Please add it to the platform settings! 🔑";
      } else if (errorStr.includes('API_KEY_INVALID') || errorStr.includes('API key not found')) {
        errorMessage = "The provided Gemini API key is invalid. Please double-check it in your settings! 🔑";
      } else if (errorStr.includes('Failed to fetch')) {
        errorMessage = "I'm having trouble reaching the network. This might be a CORS issue or a network failure. 🌐";
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[500px] bg-white dark:bg-[#0A0A0A] rounded-3xl shadow-2xl border border-slate-100 dark:border-white/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-emerald-600 p-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">Juliana</h3>
                  <p className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Academic Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
            >
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm font-medium leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-emerald-600 text-white rounded-tr-none' 
                        : 'bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white/90 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-2 bg-slate-100 dark:bg-white/5 p-3 rounded-2xl rounded-tl-none">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Juliana is typing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Juliana anything..."
                  className="w-full pl-4 pr-12 py-3 bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-bold transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-90"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[9px] text-center mt-3 font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center">
                <Sparkles className="w-3 h-3 mr-1 text-emerald-500" /> Powered by Gemini AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
          isOpen ? 'bg-slate-800 dark:bg-white text-white dark:text-black' : 'bg-emerald-600 text-white'
        }`}
      >
        {isOpen ? <X className="w-6 h-6 sm:w-8 sm:h-8" /> : <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white dark:border-black rounded-full animate-bounce"></span>
        )}
      </motion.button>
    </div>
  );
};
