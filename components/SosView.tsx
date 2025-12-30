
import React, { useState, useEffect, useCallback } from 'react';
import { EMERGENCY_SERVICES } from '../db';
import { GoogleGenAI } from "@google/genai";
import { ParkingSpot } from '../types';

interface SosViewProps {
  activeSpot: ParkingSpot | null;
  onBack: () => void;
}

interface RecoveryBusiness {
  name: string;
  address: string;
  number?: string;
  uri?: string;
  type: string;
  distanceStatus?: string;
}

type RecoveryCategory = 'ALL' | 'REPAIR' | 'TYRES' | 'BATTERY' | 'TOWING' | 'FUEL';

const SosView: React.FC<SosViewProps> = ({ activeSpot, onBack }) => {
  const [businesses, setBusinesses] = useState<RecoveryBusiness[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<RecoveryCategory>('ALL');

  const fetchNearbyRecovery = useCallback(async () => {
    setBusinesses([]);
    setLoading(true);
    
    try {
      const searchLat = activeSpot ? activeSpot.latitude : null;
      const searchLng = activeSpot ? activeSpot.longitude : null;

      const performSearch = async (lat: number, lng: number) => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        let subQuery = "automotive recovery services";
        if (category === 'TOWING') subQuery = "towing and flatbed services";
        else if (category === 'REPAIR') subQuery = "car mechanics and workshops";
        else if (category === 'TYRES') subQuery = "tyre repair and replacement shops";
        else if (category === 'BATTERY') subQuery = "car battery dealers and jump-start services";
        else if (category === 'FUEL') subQuery = "petrol and diesel stations";

        const query = `List 5 ${subQuery} at ${lat},${lng}. Brief title + phone.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: query,
          config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
              retrievalConfig: {
                latLng: { latitude: lat, longitude: lng }
              }
            },
            thinkingConfig: { thinkingBudget: 0 }
          },
        });

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const text = response.text || "";

        const found: RecoveryBusiness[] = chunks
          .filter(c => c.maps)
          .map(c => {
            const title = c.maps!.title || "Fleet Logistics Node";
            const phoneMatch = text.match(/(\+91[\s-]?)?\d{10}/);

            return {
              name: title,
              address: "Active Sector Hub",
              uri: c.maps!.uri,
              type: inferType(title, text),
              number: phoneMatch ? phoneMatch[0] : undefined,
              distanceStatus: "Localized"
            };
          });

        setBusinesses(found);
        setLoading(false);
      };

      if (searchLat && searchLng) {
        await performSearch(searchLat, searchLng);
      } else {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          await performSearch(pos.coords.latitude, pos.coords.longitude);
        }, () => setLoading(false), { enableHighAccuracy: false });
      }
    } catch (e) {
      console.error("SOS Link Failure:", e);
      setLoading(false);
    }
  }, [activeSpot, category]);

  useEffect(() => {
    fetchNearbyRecovery();
  }, [fetchNearbyRecovery]);

  const inferType = (title: string, context: string) => {
    const val = (title + context).toLowerCase();
    if (val.includes('tow') || val.includes('crane')) return 'Recovery Unit';
    if (val.includes('tyre') || val.includes('tire')) return 'Tyre Specialist';
    if (val.includes('battery')) return 'Power Support';
    if (val.includes('repair') || val.includes('mechanic') || val.includes('fix')) return 'Technical Base';
    if (val.includes('fuel') || val.includes('petrol')) return 'Energy Hub';
    return 'Logistics Node';
  };

  const categories: {id: RecoveryCategory, icon: string, label: string}[] = [
    { id: 'ALL', icon: 'fa-border-all', label: 'All Ops' },
    { id: 'REPAIR', icon: 'fa-screwdriver-wrench', label: 'Fix/Repair' },
    { id: 'TYRES', icon: 'fa-circle-notch', label: 'Tyre Hub' },
    { id: 'BATTERY', icon: 'fa-car-battery', label: 'Battery' },
    { id: 'TOWING', icon: 'fa-truck-pickup', label: 'Towing' },
    { id: 'FUEL', icon: 'fa-gas-pump', label: 'Energy/Fuel' },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-40 bg-slate-950">
      <div className="sticky top-0 z-40 px-6 py-6 bg-slate-900 border-b border-white/5 flex items-center justify-between shadow-2xl">
        <button onClick={onBack} className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-90 transition-all border border-white/5">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">Security Protocol</span>
          <h2 className="font-black text-white text-lg italic uppercase tracking-tighter leading-none mt-1">SOS Logistics</h2>
        </div>
        <div className="w-12"></div>
      </div>

      <div className="p-6 space-y-10">
        {/* EMERGENCY HOTLINES */}
        <div className="space-y-4">
           <div className="flex items-center space-x-3 ml-4">
              <i className="fa-solid fa-phone-volume text-rose-500 text-xs"></i>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Direct Response Linkage</h3>
           </div>
           <div className="grid grid-cols-2 gap-4">
              {EMERGENCY_SERVICES.slice(0, 4).map(s => (
                <button 
                  key={s.id} 
                  onClick={() => window.location.href = `tel:${s.number}`}
                  className="bg-slate-900 rounded-[2.5rem] p-6 shadow-xl border border-white/5 flex flex-col items-center text-center space-y-3 active:scale-95 transition-all group relative overflow-hidden"
                >
                  <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-inner border border-rose-500/10">
                     <i className={`fa-solid ${s.icon}`}></i>
                  </div>
                  <div className="flex flex-col">
                    <h4 className="font-black text-white text-[11px] uppercase italic leading-none mb-1">{s.name}</h4>
                    <p className="mono text-[10px] font-bold text-rose-500 tracking-widest">{s.number}</p>
                  </div>
                </button>
              ))}
           </div>
        </div>

        {/* SECTOR LOGISTICS SELECTOR (SCROLLABLE) */}
        <div className="space-y-6">
           <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3 ml-4">
                 <i className="fa-solid fa-screwdriver-wrench text-blue-500 text-xs"></i>
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Sector Field Units</h3>
              </div>
              
              {/* Tactical Carousel */}
              <div className="relative group">
                <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-6 px-2 mask-linear snap-x">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`shrink-0 px-8 py-5 rounded-[2rem] flex items-center space-x-4 transition-all duration-300 snap-center border-2 ${
                        category === cat.id 
                        ? 'bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] scale-105 border-blue-400' 
                        : 'bg-slate-900 text-slate-500 border-white/5 hover:border-slate-700'
                      }`}
                    >
                      <i className={`fa-solid ${cat.icon} text-lg`}></i>
                      <div className="flex flex-col items-start">
                         <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{cat.label}</span>
                         <span className={`text-[7px] font-bold uppercase tracking-widest leading-none ${category === cat.id ? 'text-blue-100' : 'text-slate-600'}`}>
                           {category === cat.id ? 'Sector Active' : 'Available'}
                         </span>
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Scroll Indicators */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none p-2 animate-pulse opacity-30">
                   <i className="fa-solid fa-chevron-left text-blue-500 text-xs"></i>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none p-2 animate-pulse opacity-30">
                   <i className="fa-solid fa-chevron-right text-blue-500 text-xs"></i>
                </div>
              </div>
           </div>

           <div className="bg-slate-950 rounded-[3rem] p-3 space-y-3 min-h-[400px] flex flex-col relative border border-slate-900 shadow-inner">
             {loading ? (
               <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-6 text-center">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <div className="radar-ping"></div>
                    <i className="fa-solid fa-satellite-dish text-4xl text-blue-500 z-10"></i>
                  </div>
                  <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic animate-pulse">Syncing Logistic Overlays...</p>
               </div>
             ) : businesses.length > 0 ? (
               <div className="space-y-3 animate-fade-in px-1">
                 {businesses.map((biz, idx) => (
                   <div key={idx} className="bg-slate-900/95 backdrop-blur-2xl rounded-[2.25rem] p-5 shadow-lg border border-white/5 flex items-center justify-between group transition-all hover:border-blue-500/40">
                     <div className="flex items-center space-x-5">
                       <div className="w-12 h-12 rounded-xl bg-blue-500/5 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/10 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                         <i className={`fa-solid ${
                           biz.type.includes('Energy') ? 'fa-gas-pump' :
                           biz.type.includes('Power') ? 'fa-car-battery' :
                           biz.type.includes('Tyre') ? 'fa-circle-notch' :
                           biz.type.includes('Recovery') ? 'fa-truck-pickup' :
                           'fa-screwdriver-wrench'
                         } text-lg`}></i>
                       </div>
                       <div className="min-w-0">
                         <h5 className="font-black text-white text-xs uppercase italic truncate max-w-[140px] leading-tight mb-1">{biz.name}</h5>
                         <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest leading-none">{biz.type}</span>
                       </div>
                     </div>
                     <div className="flex space-x-2">
                       {biz.number && (
                         <button onClick={() => window.location.href = `tel:${biz.number}`} className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-xl shadow-emerald-900/20">
                           <i className="fa-solid fa-phone text-xs"></i>
                         </button>
                       )}
                       {biz.uri && (
                         <button onClick={() => window.open(biz.uri!, '_blank')} className="w-10 h-10 bg-white text-slate-900 rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-lg">
                           <i className="fa-solid fa-location-arrow text-xs"></i>
                         </button>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                  <i className="fa-solid fa-magnifying-glass-location text-3xl mb-4 text-slate-600"></i>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic leading-relaxed">No Nodes identified in sector.</p>
               </div>
             )}
           </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .mask-linear { mask-image: linear-gradient(to right, black 85%, transparent 100%); }
      `}</style>
    </div>
  );
};

export default SosView;
