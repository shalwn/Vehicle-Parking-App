
import React, { useState, useEffect } from 'react';
import { ParkingSpot, Vehicle, User, WeatherData } from '../types';
import { GoogleGenAI } from "@google/genai";

interface HomeViewProps {
  activeSpot: ParkingSpot | null;
  selectedVehicle: Vehicle;
  vehicles: Vehicle[];
  isDarkMode: boolean;
  currentUser: User | null;
  onToggleTheme: () => void;
  onSelectVehicle: (id: string) => void;
  onSave: () => void;
  onManualSelect: () => void;
  onViewDetails: () => void;
  onManageVehicles: () => void;
  onFindParking: () => void;
  onLogout: () => void;
  onOpenAi: () => void;
  onHistory: () => void;
  onSos: () => void;
  onProfile: () => void;
  showNotification: (msg: string, type?: 'info' | 'success') => void;
}

const HomeView: React.FC<HomeViewProps> = ({ 
  activeSpot, selectedVehicle, vehicles, isDarkMode, currentUser, onToggleTheme, onSelectVehicle, onSave, onManualSelect, onViewDetails, onManageVehicles, onFindParking, onLogout, onOpenAi, onHistory, onSos, onProfile, showNotification 
}) => {
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [areaName, setAreaName] = useState<string>('Detecting location...');
  const [showInitOptions, setShowInitOptions] = useState(false);
  const [showTraffic, setShowTraffic] = useState(true);
  const [time, setTime] = useState(new Date());
  const [weather] = useState<WeatherData>({ temp: 31, condition: 'Sunny', icon: 'fa-sun' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [parkedDuration, setParkedDuration] = useState<string>('00h 00m');
  const [offlineMapUrl, setOfflineMapUrl] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      if (activeSpot) {
        const diff = now.getTime() - activeSpot.parkedAt;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setParkedDuration(`${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`);
      }
    }, 1000);

    const watchId = navigator.geolocation.watchPosition((pos) => {
      const current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCoords(current);
    }, (err) => {
      console.warn("Location error:", err);
    }, { enableHighAccuracy: true });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [activeSpot]);

  useEffect(() => {
    if (coords && isOnline) {
      const fetchArea = async () => {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `The current GPS coordinates are ${coords.lat}, ${coords.lng}. Tell me the short name of the area or neighborhood and city in 5 words or less.`
          });
          setAreaName(response.text?.trim() || "Location Synced");
        } catch (e) {
          setAreaName("Location Active");
        }
      };
      fetchArea();

      const staticUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${coords.lat},${coords.lng}&zoom=17&size=600x600&maptype=roadmap&key=${process.env.API_KEY}`;
      localStorage.setItem('hub_offline_map', staticUrl);
      setOfflineMapUrl(staticUrl);
    } else if (!isOnline) {
      setOfflineMapUrl(localStorage.getItem('hub_offline_map'));
    }
  }, [coords, isOnline]);

  const displayLat = activeSpot ? activeSpot.latitude : coords?.lat;
  const displayLng = activeSpot ? activeSpot.longitude : coords?.lng;
  const mapSrc = displayLat 
    ? `https://maps.google.com/maps?q=${displayLat},${displayLng}&z=17&output=embed${showTraffic ? '&layer=t' : ''}` 
    : '';

  return (
    <div className="flex flex-col min-h-screen">
      {/* HUD HEADER */}
      <div className="bg-slate-950/90 backdrop-blur-2xl text-white px-6 py-4 flex items-center justify-between shadow-2xl sticky top-0 z-[60] border-b border-white/5">
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black italic text-blue-500 leading-none tracking-[0.2em] mb-1">COMMAND HUB</span>
            <span className="mono text-xs font-bold text-slate-400">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
           <div className="bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 flex items-center space-x-2">
             <i className={`fa-solid ${weather.icon} text-amber-400 text-[10px]`}></i>
             <span className="text-[10px] font-black uppercase text-blue-400 tracking-tighter">{weather.temp}°C</span>
           </div>
        </div>
      </div>

      <header className="px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-4 cursor-pointer group" onClick={onProfile}>
          <div className="w-14 h-14 bg-slate-900 rounded-2xl shadow-xl border border-slate-800 flex flex-none items-center justify-center overflow-hidden transition-all group-hover:scale-105 active:scale-95 aspect-square">
             {currentUser?.avatar ? <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover" /> : <i className="fa-solid fa-user-pilot text-blue-500 text-lg"></i>}
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-xl font-black text-white uppercase italic leading-none truncate">{currentUser?.firstName || 'Commander'}</h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center truncate">
              <span className="text-blue-500 mr-1 flex-none"><i className="fa-solid fa-location-dot"></i></span>
              <span className="truncate">{areaName}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end flex-none">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
            {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span className={`text-[8px] font-bold uppercase mt-1 ${isOnline ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isOnline ? 'Live Link' : 'Offline Storage'}
          </span>
        </div>
      </header>

      {/* VEHICLE SELECTOR */}
      <div className="px-6 pb-4">
        <div className="flex space-x-3 overflow-x-auto pb-4 no-scrollbar">
          {vehicles.map(v => (
            <div key={v.id} className="relative flex-none">
              <button 
                onClick={() => onSelectVehicle(v.id)}
                className={`px-5 py-4 rounded-2xl border-2 transition-all duration-300 flex items-center space-x-3 ${
                  selectedVehicle.id === v.id 
                    ? 'border-blue-600 bg-blue-600/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)] scale-105' 
                    : 'border-transparent bg-slate-900 text-slate-500'
                }`}
              >
                <i className={`fa-solid ${v.icon} text-lg flex-none`}></i>
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-black text-[9px] uppercase tracking-widest leading-none truncate">{v.name}</span>
                </div>
              </button>
            </div>
          ))}
          <button onClick={onManageVehicles} className="flex-none w-12 h-full rounded-2xl border-2 border-dashed border-slate-800 flex items-center justify-center text-slate-700 hover:border-blue-500 hover:text-blue-500 transition-all">
              <i className="fa-solid fa-plus text-sm"></i>
          </button>
        </div>

        {activeSpot ? (
          <div onClick={onViewDetails} className="bg-slate-900 rounded-[2.25rem] p-6 shadow-2xl border border-slate-800 flex items-center justify-between active:scale-[0.98] transition-all group cursor-pointer relative">
             <div className="flex items-center space-x-5 min-w-0">
               <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex flex-none items-center justify-center shadow-xl aspect-square">
                  <i className={`fa-solid ${selectedVehicle.icon} text-2xl`}></i>
               </div>
               <div className="min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-none"></span>
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest truncate">VEHICLE SECURED</span>
                  </div>
                  <h2 className="text-lg font-black text-white uppercase italic leading-none truncate">{selectedVehicle.name}</h2>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <i className="fa-solid fa-stopwatch text-[9px] text-blue-500 flex-none"></i>
                      <span className="mono text-[10px] text-blue-400 font-bold">{parkedDuration}</span>
                    </div>
                  </div>
               </div>
             </div>
             <i className="fa-solid fa-chevron-right text-slate-700 group-hover:translate-x-1 group-hover:text-blue-500 transition-all flex-none"></i>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border border-slate-800 text-center space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <i className={`fa-solid ${selectedVehicle.icon} text-8xl`}></i>
            </div>
            <div className="w-20 h-20 bg-blue-600 text-white rounded-[1.75rem] flex flex-none items-center justify-center mx-auto shadow-[0_0_40px_rgba(37,99,235,0.4)] aspect-square">
                <i className={`fa-solid ${selectedVehicle.icon} text-3xl`}></i>
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight truncate">{selectedVehicle.plateNumber}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 italic truncate">{selectedVehicle.brand} {selectedVehicle.model}</p>
            </div>
            <button onClick={() => setShowInitOptions(true)} className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-xl active:scale-95 transition-all border-b-4 border-blue-800 active:border-b-0 italic flex items-center justify-center space-x-3">
              <i className="fa-solid fa-satellite-dish animate-pulse flex-none"></i>
              <span>DEPLOY TRACKING</span>
            </button>
          </div>
        )}
      </div>

      {/* REAL-TIME MAP VIEWPORT - CREATIVE HUD UPGRADE */}
      <div className="px-6 flex-1 flex flex-col pb-32">
        <div className="flex-1 bg-slate-950 rounded-[3rem] overflow-hidden border border-blue-500/20 shadow-[0_0_50px_rgba(0,0,0,1)] relative group">
          
          {/* Tactical HUD Overlay - BLINKING TEXT & SCANNER */}
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6 overflow-hidden">
             <div className="flex justify-between items-start">
                <div className="flex flex-col">
                   <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></div>
                      <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.3em]">Sector Status: Active</span>
                   </div>
                   <span className="mono text-[7px] text-slate-600 mt-1 uppercase">Feed ID: PRK-LINK-{Math.floor(time.getTime()/1000000)}</span>
                </div>
                <div className="text-right">
                   <span className="mono text-[8px] text-blue-500 font-bold">{displayLat?.toFixed(6)}° N</span><br/>
                   <span className="mono text-[8px] text-blue-500 font-bold">{displayLng?.toFixed(6)}° E</span>
                </div>
             </div>

             {/* Moving Scanning Line */}
             <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-scan z-10"></div>
             
             <div className="flex justify-between items-end">
                <div className="bg-slate-950/40 backdrop-blur-sm p-3 rounded-xl border border-white/5">
                   <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-1">Telemetry</span>
                   <div className="flex space-x-3">
                      <div className="h-1 w-8 bg-blue-500/20 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 w-[60%] animate-pulse"></div>
                      </div>
                      <div className="h-1 w-8 bg-emerald-500/20 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 w-[90%] animate-pulse"></div>
                      </div>
                   </div>
                </div>
                <div className="bg-blue-600/20 px-3 py-1 rounded-full border border-blue-500/30">
                   <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Tactical Link Valid</span>
                </div>
             </div>
          </div>

          {!isOnline ? (
            <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
               {offlineMapUrl ? (
                 <img src={offlineMapUrl} alt="Offline Map Cache" className="w-full h-full object-cover opacity-40 grayscale sepia" />
               ) : (
                 <i className="fa-solid fa-cloud-slash text-2xl text-slate-700 mb-4"></i>
               )}
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                 <p className="text-[10px] font-black uppercase text-white tracking-widest">Network Outage</p>
                 <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Showing Cached Snapshot</p>
               </div>
            </div>
          ) : mapSrc ? (
            <div className="map-viewport">
               <iframe 
                src={mapSrc}
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.8) contrast(1.2)' }} 
                allowFullScreen={false} 
                loading="lazy"
                title="Hub Tactical Map"
              ></iframe>
              <div className="absolute inset-0 pointer-events-none border-[12px] border-blue-500/5 rounded-[3rem]"></div>
            </div>
          ) : (
            <div className="h-full bg-slate-950 flex flex-col items-center justify-center space-y-4">
               <i className="fa-solid fa-satellite text-3xl text-blue-600 animate-pulse"></i>
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Synchronizing Map...</p>
            </div>
          )}
          
          <div className="absolute top-1/2 left-6 -translate-y-1/2 flex flex-col space-y-3 z-30">
            <button 
              onClick={() => setShowTraffic(!showTraffic)} 
              disabled={!isOnline}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border border-white/10 ${!isOnline ? 'opacity-30 cursor-not-allowed' : (showTraffic ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-900/80 text-slate-500')}`}
              title="Toggle Traffic"
            >
              <i className="fa-solid fa-car-tunnel text-xs"></i>
            </button>
          </div>
        </div>
      </div>

      {/* DEPLOYMENT OVERLAY */}
      {showInitOptions && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/90 backdrop-blur-md p-6 animate-fade-in">
           <div className="w-full max-w-sm bg-slate-900 rounded-[2.5rem] p-10 shadow-4xl space-y-4 animate-slide-up border border-slate-800">
              <div className="text-center space-y-2 mb-8">
                <i className="fa-solid fa-bullseye text-blue-500 text-2xl mb-2"></i>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Mission Deployment</h3>
              </div>
              <button onClick={() => { onSave(); setShowInitOptions(false); }} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl flex items-center justify-center space-x-3 active:scale-95 italic">
                <i className="fa-solid fa-location-crosshairs flex-none"></i>
                <span>AUTO GPS LOCK</span>
              </button>
              <button onClick={() => { onManualSelect(); setShowInitOptions(false); }} className="w-full py-5 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center space-x-3 active:scale-95 italic">
                <i className="fa-solid fa-map-pin flex-none"></i>
                <span>MANUAL OVERRIDE</span>
              </button>
              <button onClick={() => setShowInitOptions(false)} className="w-full py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic mt-2 hover:text-rose-500 transition-colors">Abort</button>
           </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scan { from { top: 0; } to { top: 100%; } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-scan { animation: scan 4s linear infinite; }
      `}</style>
    </div>
  );
};

export default HomeView;
