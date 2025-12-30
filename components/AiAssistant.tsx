
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { HealthLog, Vehicle } from '../types';
import * as DB from '../db';

interface AiAssistantProps {
  onBack: () => void;
  latLng: { lat: number, lng: number } | null;
  selectedVehicle?: Vehicle;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ onBack, latLng, selectedVehicle }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: "Target area locked. I am your AI Fleet Assistant. I can help with navigation, parking safety, and vehicle health analysis. How can I assist today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'health'>('chat');
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedVehicle) {
      setHealthLogs(DB.getHealthLogs(selectedVehicle.id));
    }
  }, [selectedVehicle]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, isTyping]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isTyping) return;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `You are the Google AI Maps & Fleet Assistant for "Parked!".
      Context: Current Position ${latLng ? `${latLng.lat}, ${latLng.lng}` : 'Unknown'}.
      Active Vehicle: ${selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : 'None'}.
      Recent Health Logs: ${JSON.stringify(healthLogs.slice(0, 3))}.
      Be professional, tactical, and concise. User says: ${textToSend}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      setMessages(prev => [...prev, { role: 'assistant', text: response.text || "Intel unavailable." }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Neural link disrupted. Try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startVoice = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.start();
      recognition.onresult = (event: any) => {
        handleSend(event.results[0][0].transcript);
      };
    }
  };

  const addLog = async (desc: string) => {
    if (!selectedVehicle || !desc.trim()) return;
    setIsTyping(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const analysisResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this vehicle issue for a ${selectedVehicle.brand} ${selectedVehicle.model}: "${desc}". Provide a short safety tip and priority (High/Low).`
      });

      const newLog: HealthLog = {
        id: Date.now().toString(),
        vehicleId: selectedVehicle.id,
        timestamp: Date.now(),
        description: desc,
        category: 'general',
        aiAnalysis: analysisResponse.text
      };

      DB.addHealthLog(newLog);
      setHealthLogs(prev => [newLog, ...prev]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white">
      <div className="px-6 py-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between">
        <button onClick={onBack} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center active:scale-90 border border-white/5">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl">
           <button onClick={() => setActiveTab('chat')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest ${activeTab === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Neural Chat</button>
           <button onClick={() => setActiveTab('health')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest ${activeTab === 'health' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>Asset Health</button>
        </div>
        <div className="w-12"></div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {activeTab === 'chat' ? (
          <>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm font-bold shadow-xl border ${
                  m.role === 'user' ? 'bg-blue-600 border-blue-400/20' : 'bg-slate-900 border-white/5'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && <div className="text-[8px] font-black uppercase tracking-widest text-blue-500 animate-pulse">Processing Intel...</div>}
          </>
        ) : (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-emerald-600/10 border border-emerald-500/20 p-6 rounded-3xl">
                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Log Maintenance Issue</h4>
                <div className="flex space-x-2">
                   <input id="health-input" placeholder="e.g. Unusual noise from front tyres..." className="flex-1 bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-emerald-500" />
                   <button onClick={() => {
                     const el = document.getElementById('health-input') as HTMLInputElement;
                     addLog(el.value);
                     el.value = '';
                   }} className="bg-emerald-600 px-4 py-3 rounded-xl text-[10px] font-black uppercase">Log</button>
                </div>
             </div>
             <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Registry Logs</h4>
                {healthLogs.map(log => (
                  <div key={log.id} className="bg-slate-900 border border-white/5 p-5 rounded-2xl space-y-3">
                     <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black text-slate-200 italic truncate w-3/4">{log.description}</span>
                        <span className="text-[8px] font-bold text-slate-500">{new Date(log.timestamp).toLocaleDateString()}</span>
                     </div>
                     {log.aiAnalysis && (
                        <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                           <p className="text-[10px] font-bold text-emerald-400 italic leading-relaxed">{log.aiAnalysis}</p>
                        </div>
                     )}
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      <div className="p-6 pb-12 bg-slate-900 border-t border-white/10 rounded-t-[3rem]">
        <div className="relative flex items-center space-x-3">
          <button onClick={startVoice} className="w-12 h-12 bg-slate-800 text-emerald-500 rounded-2xl border border-white/5 active:scale-90 transition-all">
             <i className="fa-solid fa-microphone-lines"></i>
          </button>
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type or use voice..."
            className="flex-1 px-6 py-5 bg-slate-800 rounded-2xl border border-white/5 outline-none focus:ring-2 focus:ring-blue-600 font-bold text-xs"
          />
          <button onClick={() => handleSend()} disabled={isTyping} className="w-12 h-12 bg-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all">
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
