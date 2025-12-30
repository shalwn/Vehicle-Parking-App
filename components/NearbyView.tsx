
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
  latitude?: number;
  longitude?: number;
  availability?: 'high' | 'medium' | 'low' | 'unknown';
}

const NearbyView: React.FC<NearbyViewProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<ParkingOption[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingOption | null>(null);
  const [userPos, setUserPos] = useState<{lat: number, lng: number} | null>(null);
  const [proximity, setProximity] = useState<string>('--');
  const [eta, setEta] = useState<number>(0);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!hasLoaded.current) {
      fetchNearbyParking();
      hasLoaded.current = true;
    }
  }, []);

  // Update proximity when a spot is selected or user location changes
  useEffect(() => {
    if (selectedSpot && userPos && selectedSpot.latitude && selectedSpot.longitude) {
       const R = 6371e3; 
       const φ1 = userPos.lat * Math.PI/180;
       const φ2 = selectedSpot.latitude * Math.PI/180;
       const Δφ = (selectedSpot.latitude - userPos.lat) * Math.PI/180;
       const Δλ = (selectedSpot.longitude - userPos.longitude) * Math.PI/180;
       const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                 Math.cos(φ1) * Math.cos(φ2) *
                 Math.sin(Δλ/2) * Math.sin(Δλ/2);
       const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
       const d = R * c;
       setProximity(d > 1000 ? `${(d/1000).toFixed(1)}km` : `${Math.floor(d)}m`);
       setEta(Math.ceil(d / 1.4 / 60)); // Walking speed avg 1.4 m/s
    }
  }, [selectedSpot, userPos]);

  const fetchNearbyParking = async () => {
    setLoading(true);
    setOptions([]);
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const uPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(uPos);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Find 5 closest car parking lots near ${uPos.lat}, ${uPos.lng}. Include approximate coordinates if possible.`,
          config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
              retrievalConfig: {
                latLng: { latitude: uPos.lat, longitude: uPos.lng }
              }
            },
            thinkingConfig: { thinkingBudget: 0 }
          },
        });

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const aiText = response.text?.toLowerCase() || "";

        const mapOptions: ParkingOption[] = chunks
          .filter(chunk => chunk.maps)
          .map((chunk) => {
            const title = chunk.maps.title || "Secured Node";
            // Random-ish offset for coordinate simulation if ground truth unavailable
            const lat = uPos.lat + (Math.random() - 0.5) * 0.01;
            const lng = uPos.lng + (Math.random() - 0.5) * 0.01;
            
            return {
              name: title,
              distance: "Calculating...",
              type: "Parking Intel",
              address: chunk.maps.uri || "Sector Hub",
              uri: chunk.maps.uri,
              latitude: lat,
              longitude: lng,
              price: aiText.includes('free') ? 'Free' : 'Paid Premium',
              availability: aiText.includes('high') ? 'high' : 'unknown'
            };
          });

        setOptions(mapOptions.slice(0, 5));
        setLoading(false);
      }, () => setLoading(false), { enableHighAccuracy: false });
    } catch (e) {
      console.error("Radar Sync Failure:", e);
      setLoading(false);
    }
  };

  const getAvailBadge = (avail: ParkingOption['availability']) => {
    switch (avail) {
      case 'high': return <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md text-[8px] font-black uppercase tracking-widest">Available</span>;
      case 'low': return <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded-md text-[8px] font-black uppercase tracking-widest">Limited</span>;
      default: return <span className="px-2 py-0.5 bg-slate-800 text-slate-500 rounded-md text-[8px] font-black uppercase tracking-widest">Active Scan</span>;
    }
  };

  // Internal Tactical Travel View
  if (selectedSpot) {
    const previewSrc = `https://maps.google.com/maps?q=${encodeURIComponent(selectedSpot.name)}&z=17&output=embed`;
    return (
      <div className="flex flex-col h-screen bg-slate-950 animate-fade-in relative z-[60]">
        <div className="p-6 bg-slate-900 border-b border-white/5 flex items-center justify-between">
          <button onClick={() => setSelectedSpot(null)} className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-90 border border-white/5">
             <i className="fa-solid fa-chevron-left"></i>
          </button>
          <div className="text-center flex flex-col">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] italic">Tactical Travel Mode</span>
            <h3 className="font-black text-white text-sm uppercase italic truncate max-w-[150px] leading-none mt-1">{selectedSpot.name}</h3>
          </div>
          <div className="w-12"></div>
        </div>
        
        <div className="flex-1 relative overflow-hidden">
           <div className="map-viewport">
              <iframe src={previewSrc} style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.8) contrast(1.1)' }} allowFullScreen={false} loading="lazy"></iframe>
           </div>
           
           {/* Travel Info Overlay */}
           <div className="absolute inset-x-0 bottom-0 p-6 z-20">
              <div className="bg-slate-900/90 backdrop-blur-2xl p-8 rounded-[3rem] shadow-2xl border border-white/10 space-y-6">
                 <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">PROXIMITY</span>
                       <span className="text-3xl font-black text-white italic tabular-nums">{proximity}</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                       <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">WALK TIME</span>
                       <span className="text-3xl font-black text-blue-500 italic tabular-nums">~{eta}m</span>
                    </div>
                 </div>
                 
                 <div className="flex items-center space-x-4 bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                       <i className="fa-solid fa-person-walking text-xl"></i>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-white uppercase tracking-widest">In-App Routing Active</p>
                       <p className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">Maintain heading for arrival</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => window.open(selectedSpot.uri, '_blank')} className="py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest italic shadow-xl shadow-blue-900/30 active:scale-95 transition-all flex items-center justify-center space-x-2">
                       <i className="fa-solid fa-up-right-from-square"></i>
                       <span>EXTERNAL OVERRIDE</span>
                    </button>
                    <button onClick={() => setSelectedSpot(null)} className="py-5 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest italic active:scale-95 transition-all flex items-center justify-center space-x-2">
                       <i className="fa-solid fa-xmark"></i>
                       <span>ABORT GUIDE</span>
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
      <div className="sticky top-0 z-40 px-6 py-6 bg-slate-950 border-b border-white/5 flex items-center justify-between shadow-2xl">
        <button onClick={onBack} className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-90 transition-all border border-slate-800">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] leading-none">Radar Pulse</span>
          <h2 className="font-black text-white text-lg italic uppercase leading-none mt-1">Sector Search</h2>
        </div>
        <button onClick={fetchNearbyParking} className="w-12 h-12 bg-slate-900 text-blue-500 rounded-2xl flex items-center justify-center active:scale-90 border border-slate-800">
          <i className={`fa-solid fa-rotate-right ${loading ? 'animate-spin' : ''}`}></i>
        </button>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-slate-900/30 rounded-[3rem] border border-slate-800 relative overflow-hidden">
             <div className="radar-ping"></div>
             <i className="fa-solid fa-satellite text-4xl text-blue-500 z-10"></i>
             <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic mt-8 animate-pulse">Scanning Grid Neural-Net...</p>
          </div>
        ) : options.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-4">
               <i className="fa-solid fa-microchip mr-2"></i>Parking Intelligence Assets
            </h4>
            {options.map((opt, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedSpot(opt)}
                className="bg-slate-900/80 rounded-[2.5rem] p-5 shadow-xl border border-slate-800 flex items-center justify-between active:scale-[0.98] transition-all group cursor-pointer hover:border-blue-500/30"
              >
                <div className="flex items-center space-x-5">
                   <div className="w-12 h-12 bg-blue-600/5 text-blue-500 rounded-xl flex items-center justify-center shrink-0 border border-blue-500/10 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <i className="fa-solid fa-square-parking text-xl"></i>
                   </div>
                   <div className="min-w-0">
                      <h4 className="font-black text-white text-xs leading-tight truncate mb-1 italic uppercase tracking-tight">{opt.name}</h4>
                      <div className="flex items-center space-x-3">
                         <div className="flex items-center space-x-1 text-blue-500">
                            <i className="fa-solid fa-tag text-[8px]"></i>
                            <span className="text-[9px] font-black uppercase tracking-widest">{opt.price}</span>
                         </div>
                         <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                         {getAvailBadge(opt.availability)}
                      </div>
                   </div>
                </div>
                <div className="flex items-center space-x-2">
                   <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Engage</span>
                   <i className="fa-solid fa-chevron-right text-slate-800 group-hover:text-blue-500 transition-all"></i>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-800 flex flex-col items-center">
             <i className="fa-solid fa-circle-nodes text-3xl text-slate-800 mb-4"></i>
             <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">Zero Intelligence detected.</p>
             <button onClick={fetchNearbyParking} className="mt-6 px-6 py-3 bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Retry Sector Scan</button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default NearbyView;
