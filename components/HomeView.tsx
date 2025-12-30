
import React, { useState, useEffect } from 'react';
import { ParkingSpot, Vehicle, User, WeatherData } from '../types';

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
  const [showInitOptions, setShowInitOptions] = useState(false);
  const [showTraffic, setShowTraffic] = useState(true);
  const [time, setTime] = useState(new Date());
  const [weather] = useState<WeatherData>({ temp: 31, condition: 'Sunny', icon: 'fa-sun' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [parkedDuration, setParkedDuration] = useState<string>('00h 00m');

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      if (activeSpot) {
        const diff = Date.now() - activeSpot.parkedAt;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setParkedDuration(`${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`);
      }
    }, 1000);

    const watchId = navigator.geolocation.watchPosition((pos) => {
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
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

  const handleShare = async () => {
    if (!activeSpot) return;
    const shareData = {
      title: 'Parked! Vehicle Location',
      text: `My ${selectedVehicle.name} is parked here: https://www.google.com/maps/search/?api=1&query=${activeSpot.latitude},${activeSpot.longitude}`,
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(shareData.text);
        showNotification("Link copied to clipboard", "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const displayLat = activeSpot ? activeSpot.latitude : coords?.lat;
  const displayLng = activeSpot ? activeSpot.longitude : coords?.lng;
  const mapSrc = displayLat ? `https://maps.google.com/maps?q=${displayLat},${displayLng}&z=18&output=embed${showTraffic ? '&layer=t' : ''}` : '';

  return (
    <div className="flex flex-col min-h-screen">
      {/* STATUS HUD */}
      <div className="bg-slate-950/80 backdrop-blur-xl text-white px-6 py-4 flex items-center justify-between shadow-2xl sticky top-0 z-[60] border-b border-white/5">
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black italic text-blue-500 leading-none tracking-[0.2em] mb-1">COMMAND CORE</span>
            <span className="mono text-xs font-bold text-slate-400">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        <div className="flex items-center space-x-6">
           <div className="bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 flex items-center space-x-2">
             <i className={`fa-solid ${weather.icon} text-amber-400 text-[10px]`}></i>
             <span className="text-[10px] font-black uppercase text-blue-400 tracking-tighter">{weather.temp}°C</span>
           </div>
        </div>
      </div>

      <header className="px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-4 cursor-pointer group has-tooltip" onClick={onProfile}>
          <div className="w-14 h-14 bg-slate-900 rounded-2xl shadow-xl border border-slate-800 flex items-center justify-center overflow-hidden transition-all group-hover:scale-105 active:scale-95">
             {currentUser?.avatar ? <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover" /> : <i className="fa-solid fa-user-gear text-blue-500 text-lg"></i>}
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-white uppercase italic leading-none">{currentUser?.firstName || 'Pilot'}</h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center">
              <span className={`w-1.5 h-1.5 rounded-full mr-2 ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></span>
              {isOnline ? 'FLEET ONLINE' : 'LOCAL CACHE'}
            </p>
          </div>
          <span className="tooltip absolute mt-20 ml-2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded font-black tracking-widest uppercase">Open Profile</span>
        </div>
        <div className="flex space-x-2">
          {activeSpot && (
            <div className="relative has-tooltip">
              <button onClick={handleShare} className="w-11 h-11 rounded-xl bg-blue-600 text-white shadow-lg flex items-center justify-center active:scale-90 transition-all">
                <i className="fa-solid fa-share-nodes text-sm"></i>
              </button>
              <span className="tooltip absolute right-0 mt-2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded font-black tracking-widest uppercase">Share Location</span>
            </div>
          )}
          <div className="relative has-tooltip">
            <button onClick={onToggleTheme} className="w-11 h-11 rounded-xl glass-panel shadow-lg flex items-center justify-center text-slate-300 active:scale-90 transition-all">
              <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-sm`}></i>
            </button>
            <span className="tooltip absolute right-0 mt-2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded font-black tracking-widest uppercase">Toggle Theme</span>
          </div>
        </div>
      </header>

      {/* ASSET SELECTOR */}
      <div className="px-6 pb-4">
        {!activeSpot ? (
          <div className="space-y-6">
            <div className="flex space-x-3 overflow-x-auto pb-4 no-scrollbar">
              {vehicles.map(v => (
                <div key={v.id} className="relative has-tooltip">
                  <button 
                    onClick={() => onSelectVehicle(v.id)}
                    className={`shrink-0 px-5 py-4 rounded-2xl border-2 transition-all duration-300 flex items-center space-x-3 ${
                      selectedVehicle.id === v.id 
                        ? 'border-blue-600 bg-blue-600/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-105' 
                        : 'border-transparent bg-slate-900 text-slate-500'
                    }`}
                  >
                    <i className={`fa-solid ${v.icon} text-lg`}></i>
                    <span className="font-bold text-[10px] uppercase tracking-widest">{v.name}</span>
                  </button>
                  <span className="tooltip absolute left-1/2 -translate-x-1/2 mt-2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded font-black tracking-widest uppercase">Use {v.name}</span>
                </div>
              ))}
              <div className="relative has-tooltip">
                <button onClick={onManageVehicles} className="shrink-0 w-12 h-full rounded-2xl border-2 border-dashed border-slate-800 flex items-center justify-center text-slate-700 hover:border-blue-500 hover:text-blue-500 transition-all">
                   <i className="fa-solid fa-plus text-sm"></i>
                </button>
                <span className="tooltip absolute left-1/2 -translate-x-1/2 mt-2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded font-black tracking-widest uppercase">Manage Fleet</span>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border border-slate-800 text-center space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                 <i className={`fa-solid ${selectedVehicle.icon} text-8xl`}></i>
              </div>
              <div className="w-20 h-20 bg-blue-600 text-white rounded-[1.75rem] flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(37,99,235,0.3)] transition-transform group-hover:rotate-6">
                 <i className={`fa-solid ${selectedVehicle.icon} text-3xl`}></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">
                  <i className="fa-solid fa-id-card text-blue-500/50 mr-2 text-sm"></i>{selectedVehicle.plateNumber}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2 italic">
                  <i className="fa-solid fa-car-rear mr-2 opacity-50"></i>{selectedVehicle.model}
                </p>
              </div>
              <button onClick={() => setShowInitOptions(true)} className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-xl active:scale-95 transition-all border-b-4 border-blue-800 active:border-b-0 italic flex items-center justify-center space-x-3">
                <i className="fa-solid fa-satellite-dish animate-pulse"></i>
                <span>LOCK GPS POSITION</span>
              </button>
            </div>
          </div>
        ) : (
          <div onClick={onViewDetails} className="bg-slate-900 rounded-[2.25rem] p-6 shadow-2xl border border-slate-800 flex items-center justify-between active:scale-[0.98] transition-all group cursor-pointer has-tooltip">
             <div className="flex items-center space-x-5">
               <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-3 transition-transform">
                  <i className={`fa-solid ${selectedVehicle.icon} text-2xl`}></i>
               </div>
               <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">VEHICLE SECURED</span>
                  </div>
                  <h2 className="text-lg font-black text-white uppercase italic leading-none">{selectedVehicle.name}</h2>
                  <div className="flex items-center space-x-3 mt-1.5">
                    <i className="fa-solid fa-hourglass-start text-[10px] text-blue-500"></i>
                    <span className="mono text-[10px] text-blue-400 font-bold italic">{parkedDuration}</span>
                  </div>
               </div>
             </div>
             <i className="fa-solid fa-chevron-right text-slate-700 group-hover:translate-x-1 group-hover:text-blue-500 transition-all"></i>
             <span className="tooltip absolute left-1/2 -translate-x-1/2 mt-24 bg-slate-800 text-white text-[9px] px-2 py-1 rounded font-black tracking-widest uppercase">Session Details</span>
          </div>
        )}
      </div>

      {/* MAP VIEWPORT - Fit to Area */}
      <div className="px-6 flex-1 flex flex-col pb-32">
        <div className="flex-1 bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl relative">
          {!isOnline ? (
            <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center p-8 text-center space-y-4">
               <i className="fa-solid fa-cloud-slash text-2xl text-slate-700"></i>
               <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">System Offline • Using Static Buffer</p>
            </div>
          ) : mapSrc ? (
            <div className="h-full w-full relative">
               <iframe 
                src={mapSrc}
                width="100%" 
                height="100%" 
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.9) contrast(1.1)' }} 
                allowFullScreen={false} 
                loading="lazy"
                title="Tactical Map"
                className="scale-105"
              ></iframe>
              <div className="absolute inset-0 pointer-events-none border-[12px] border-white/5 rounded-[2.5rem]"></div>
            </div>
          ) : (
            <div className="h-full bg-slate-950 flex flex-col items-center justify-center space-y-4">
               <i className="fa-solid fa-satellite-dish text-3xl text-blue-600 animate-pulse"></i>
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Awaiting GNSS Link...</p>
            </div>
          )}
          
          <div className="absolute top-6 left-6 flex flex-col space-y-2 z-10">
            <button onClick={() => setShowTraffic(!showTraffic)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl transition-all border border-white/5 ${showTraffic ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-500'}`}>
              <i className="fa-solid fa-car-tunnel mr-2"></i>Traffic: {showTraffic ? 'LIVE' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* AI AI FAB */}
      <div className="fixed right-6 bottom-28 z-50 has-tooltip">
        <button onClick={onOpenAi} className="w-14 h-14 bg-blue-600 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center justify-center text-white text-2xl border border-white/10 active:scale-90 transition-all hover:rotate-6">
          <i className="fa-solid fa-wand-magic-sparkles"></i>
        </button>
        <span className="tooltip absolute right-0 bottom-16 bg-slate-800 text-white text-[9px] px-2 py-1 rounded font-black tracking-widest uppercase">AI Assistant</span>
      </div>

      {/* SESSION OVERLAY */}
      {showInitOptions && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/90 backdrop-blur-md p-6 animate-fade-in">
           <div className="w-full max-w-sm bg-slate-900 rounded-[2.5rem] p-10 shadow-4xl space-y-4 animate-slide-up border border-slate-800">
              <div className="text-center space-y-2 mb-8">
                <i className="fa-solid fa-bullseye text-blue-500 text-2xl mb-2"></i>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Initiate Tracking</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sector Confirmation Required</p>
              </div>
              <button onClick={() => { onSave(); setShowInitOptions(false); }} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl flex items-center justify-center space-x-3 active:scale-95 italic transition-all group">
                <i className="fa-solid fa-location-crosshairs group-hover:rotate-90 transition-transform"></i>
                <span>AUTO LOCK GNSS</span>
              </button>
              <button onClick={() => { onManualSelect(); setShowInitOptions(false); }} className="w-full py-5 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center space-x-3 active:scale-95 italic transition-all">
                <i className="fa-solid fa-map-pin"></i>
                <span>MANUAL OVERRIDE</span>
              </button>
              <button onClick={() => setShowInitOptions(false)} className="w-full py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic mt-2 hover:text-rose-500 transition-colors">Abort Mission</button>
           </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default HomeView;
