
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";

interface NearbyViewProps {
  onBack: () => void;
}

interface ParkingOption {
  name: string;
  distance: string;
  type: string;
  address: string;
  uri?: string;
  price?: string;
  availability?: 'high' | 'medium' | 'low' | 'unknown';
  lat?: number;
  lng?: number;
}

const NearbyView: React.FC<NearbyViewProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<ParkingOption[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingOption | null>(null);
  const [userPos, setUserPos] = useState<{lat: number, lng: number} | null>(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!hasLoaded.current) {
      fetchNearbyParking();
      hasLoaded.current = true;
    }
  }, []);

  const fetchNearbyParking = async () => {
    setLoading(true);
    setOptions([]);
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Quickly find 5 car parkings near ${pos.coords.latitude}, ${pos.coords.longitude}.`,
          config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
              retrievalConfig: {
                latLng: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
              }
            },
            thinkingConfig: { thinkingBudget: 0 }
          },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const aiText = response.text?.toLowerCase() || "";

        const mapOptions: ParkingOption[] = groundingChunks
          .filter(chunk => chunk.maps)
          .map((chunk) => {
            const title = chunk.maps.title || "Public Parking";
            return {
              name: title,
              distance: "Nearby",
              type: "Parking Intelligence",
              address: chunk.maps.uri || "Local Hub",
              uri: chunk.maps.uri,
              price: aiText.includes('free') ? 'Free' : 'Premium',
              availability: aiText.includes('high') ? 'high' : 'unknown'
            };
          });

        setOptions(mapOptions.slice(0, 5));
        setLoading(false);
      }, () => {
        setLoading(false);
      }, { enableHighAccuracy: false });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const getAvailBadge = (avail: ParkingOption['availability']) => {
    switch (avail) {
      case 'high': return <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md text-[8px] font-black uppercase tracking-widest">Available</span>;
      case 'low': return <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded-md text-[8px] font-black uppercase tracking-widest">Limited</span>;
      default: return <span className="px-2 py-0.5 bg-slate-800 text-slate-500 rounded-md text-[8px] font-black uppercase tracking-widest">Active</span>;
    }
  };

  if (selectedSpot) {
    const previewSrc = `https://maps.google.com/maps?q=${encodeURIComponent(selectedSpot.name)}&z=17&output=embed`;
    const routeSrc = userPos ? `https://www.google.com/maps/embed/v1/directions?key=${process.env.API_KEY}&origin=${userPos.lat},${userPos.lng}&destination=${encodeURIComponent(selectedSpot.name)}&mode=walking` : previewSrc;

    return (
      <div className="flex flex-col h-screen bg-slate-950">
        <div className="p-6 glass-panel border-b border-white/5 flex items-center justify-between">
          <button onClick={() => setSelectedSpot(null)} className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
             <i className="fa-solid fa-chevron-left"></i>
          </button>
          <div className="text-center flex flex-col">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Internal Routing</span>
            <h3 className="font-black text-white text-sm uppercase italic truncate max-w-[150px]">{selectedSpot.name}</h3>
          </div>
          <div className="w-12"></div>
        </div>
        
        <div className="flex-1 relative">
           <iframe src={previewSrc} width="100%" height="100%" style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }} allowFullScreen={false} loading="lazy"></iframe>
           <div className="absolute inset-x-0 bottom-0 p-8">
              <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-white/5 space-y-6">
                 <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Objective</span>
                       <span className="text-lg font-black text-white uppercase italic">{selectedSpot.name}</span>
                    </div>
                    <div className="text-right flex flex-col">
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Status</span>
                       <span className="text-xs font-bold text-slate-400">Tactical Advantage High</span>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => window.open(selectedSpot.uri, '_blank')} className="py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest italic shadow-xl shadow-blue-900/20 active:scale-95 transition-all">
                       <i className="fa-solid fa-location-arrow mr-2"></i>EXTERNAL LINK
                    </button>
                    <button onClick={() => setSelectedSpot(null)} className="py-5 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest italic active:scale-95 transition-all">
                       <i className="fa-solid fa-xmark mr-2"></i>ABORT PREVIEW
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-20">
      <div className="sticky top-0 z-40 px-6 py-6 glass-panel flex items-center justify-between border-b border-white/5">
        <button onClick={onBack} title="Back to Control" className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-90 transition-all border border-slate-800">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">Radar Intercept</span>
          <h2 className="font-black text-white text-lg italic uppercase">Sector Intel</h2>
        </div>
        <button onClick={fetchNearbyParking} title="Refresh Sector Scan" className="w-12 h-12 bg-slate-900 text-blue-500 rounded-2xl flex items-center justify-center active:scale-90 border border-slate-800">
          <i className={`fa-solid fa-rotate-right ${loading ? 'animate-spin' : ''}`}></i>
        </button>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 relative overflow-hidden bg-slate-950/50 rounded-[3rem] border border-slate-800">
             <div className="relative w-40 h-40 flex items-center justify-center">
                <div className="radar-ping"></div>
                <i className="fa-solid fa-satellite text-4xl text-blue-500 z-10"></i>
             </div>
             <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic mt-8 animate-pulse">Syncing Map Satellites...</p>
          </div>
        ) : options.length > 0 ? (
          <div className="space-y-4">
            {options.map((opt, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedSpot(opt)}
                className="bg-slate-900 rounded-[2rem] p-5 shadow-xl border border-slate-800 flex items-center justify-between active:scale-[0.98] transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-5">
                   <div className="w-12 h-12 bg-blue-600/5 text-blue-500 rounded-xl flex items-center justify-center shrink-0 border border-blue-500/10">
                      <i className="fa-solid fa-square-parking text-xl"></i>
                   </div>
                   <div className="min-w-0">
                      <h4 className="font-black text-white text-xs leading-tight truncate mb-1 italic uppercase">{opt.name}</h4>
                      <div className="flex items-center space-x-3">
                         <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{opt.price}</span>
                         <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                         {getAvailBadge(opt.availability)}
                      </div>
                   </div>
                </div>
                <i className="fa-solid fa-chevron-right text-slate-700 group-hover:text-blue-500 transition-all"></i>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-950/50 rounded-[3rem] border border-dashed border-slate-800">
             <i className="fa-solid fa-circle-nodes text-3xl text-slate-800 mb-4"></i>
             <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Sector Empty</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyView;
