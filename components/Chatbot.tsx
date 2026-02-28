
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import OpenAI from 'openai';
import { Module } from '../types';

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
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        console.error("DEEPSEEK_API_KEY is missing.");
        setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, my DeepSeek connection isn't configured yet. Please check the environment variables! 🛠️" }]);
        setIsLoading(false);
        return;
      }

      const openai = new OpenAI({
        apiKey,
        baseURL: 'https://api.deepseek.com',
        dangerouslyAllowBrowser: true
      });

      const systemInstruction = `
        You are Juliana, a polite, helpful, and instructor-like female academic assistant for GAKA (Academic Resource Hub).
        Your personality: Professional, encouraging, and clear. Use emojis to keep the conversation friendly.
        
        Your primary goal is to help Computer Science students at MUST find resources.
        
        ${generateContext()}
        
        Instructions:
        1. Answer questions based on the provided module and resource data.
        2. If a student asks for a specific module, you can use the 'navigateToModule' tool.
        3. If a student asks for their saved resources, use 'navigateToSaved'.
        4. If a student asks about the project or Cleven, use 'navigateToAbout'.
        5. Always be polite and use a "teacher-like" tone.
        6. If you don't know the answer, politely say so and suggest they explore the 'Modules' section.
        7. Keep responses concise but helpful.
      `;

      const tools: OpenAI.Chat.ChatCompletionTool[] = [
        {
          type: 'function',
          function: {
            name: "navigateToModule",
            description: "Navigate the user to a specific module detail page using its code (e.g., CS101).",
            parameters: {
              type: "object",
              properties: {
                moduleCode: {
                  type: "string",
                  description: "The unique code of the module to navigate to."
                }
              },
              required: ["moduleCode"]
            }
          }
        },
        {
          type: 'function',
          function: {
            name: "navigateToSaved",
            description: "Navigate the user to their saved resources library.",
            parameters: { type: "object", properties: {} }
          }
        },
        {
          type: 'function',
          function: {
            name: "navigateToAbout",
            description: "Navigate the user to the about page to learn more about GAKA and its creators.",
            parameters: { type: "object", properties: {} }
          }
        }
      ];

      const response = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: 'system', content: systemInstruction },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage }
        ],
        tools,
        tool_choice: 'auto'
      });

      const choice = response.choices[0];
      const toolCalls = choice.message.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        for (const call of toolCalls) {
          if (call.type === 'function') {
            const args = JSON.parse(call.function.arguments);
            if (call.function.name === "navigateToModule") {
              const { moduleCode } = args;
              const module = modules.find(m => m.code.toLowerCase() === moduleCode.toLowerCase());
              if (module) {
                onNavigate('detail', module);
                setMessages(prev => [...prev, { role: 'assistant', content: `Certainly! I've taken you to the ${module.name} page. You can find all the resources there! 📚✨` }]);
                setIsOpen(false);
              } else {
                setMessages(prev => [...prev, { role: 'assistant', content: `I'm sorry, I couldn't find a module with the code ${moduleCode}. Please check the code and try again! 🔍` }]);
              }
            } else if (call.function.name === "navigateToSaved") {
              onNavigate('saved');
              setMessages(prev => [...prev, { role: 'assistant', content: "Of course! Here is your personal library of saved resources. 📖✨" }]);
              setIsOpen(false);
            } else if (call.function.name === "navigateToAbout") {
              onNavigate('about');
              setMessages(prev => [...prev, { role: 'assistant', content: "I've navigated you to the About page. You can learn all about GAKA and the team here! 🤝✨" }]);
              setIsOpen(false);
            }
          }
        }
      } else {
        const botResponse = choice.message.content || "I'm sorry, I couldn't process that. Could you try again? 😅";
        setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Oh dear, I'm having a bit of trouble connecting right now. Please try again in a moment! 🛠️" }]);
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
                <Sparkles className="w-3 h-3 mr-1 text-emerald-500" /> Powered by DeepSeek AI
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
