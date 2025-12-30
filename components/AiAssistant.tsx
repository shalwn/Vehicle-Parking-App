
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface AiAssistantProps {
  onBack: () => void;
  latLng: { lat: number, lng: number } | null;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ onBack, latLng }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: "Target area locked. I am your Google AI Maps Assistant. How can I help you navigate or secure your vehicle today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `You are the Google AI Maps Assistant for the "Parked!" app.
      Current User Position: ${latLng ? `${latLng.lat}, ${latLng.lng}` : 'Unknown'}.
      Context: User wants parking advice, safety tips, or general area navigation info.
      Be concise, tactical, and helpful. Use a professional driver assistant tone.
      User says: ${userMsg}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      setMessages(prev => [...prev, { role: 'assistant', text: response.text || "Intel unavailable. Please rephrase." }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Connectivity issues with Fleet Command. Try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white">
      <div className="px-6 py-8 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-xl">
        <button onClick={onBack} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center active:scale-90 transition-all border border-white/5">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div className="text-center">
           <h2 className="text-sm font-black italic uppercase tracking-widest text-blue-400">AI Maps Assistant</h2>
           <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Active Neural Link</p>
        </div>
        <div className="w-12"></div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
             <div className={`max-w-[85%] px-6 py-4 rounded-[2rem] text-sm font-bold shadow-2xl border ${
               m.role === 'user' 
               ? 'bg-blue-600 text-white border-blue-400/20 rounded-br-none' 
               : 'bg-slate-900 text-slate-200 border-white/5 rounded-bl-none'
             }`}>
                {m.text}
             </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-pulse">
             <div className="bg-slate-900 px-6 py-4 rounded-full border border-white/5 text-[9px] font-black uppercase tracking-widest text-blue-400">
               Neural Processing...
             </div>
          </div>
        )}
      </div>

      <div className="p-6 pb-12 bg-slate-900 border-t border-white/10 rounded-t-[3rem]">
        <div className="relative flex items-center">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI Assistant..."
            className="w-full pl-6 pr-20 py-5 bg-slate-800 rounded-3xl border border-white/5 outline-none focus:ring-2 focus:ring-blue-600 font-bold text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={isTyping}
            className="absolute right-3 w-12 h-12 bg-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AiAssistant;
