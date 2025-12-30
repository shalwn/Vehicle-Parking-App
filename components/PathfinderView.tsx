
import React, { useState, useEffect } from 'react';
import { ParkingSpot, Vehicle } from '../types';

interface PathfinderViewProps {
  spot: ParkingSpot;
  vehicle: Vehicle;
  onBack: () => void;
}

const PathfinderView: React.FC<PathfinderViewProps> = ({ spot, vehicle, onBack }) => {
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [distance, setDistance] = useState<string>('--');
  const [heading, setHeading] = useState<number>(0);
  const [eta, setEta] = useState<number>(0);
  const [trackingMode, setTrackingMode] = useState<'FOLLOW_ME' | 'FOLLOW_CAR'>('FOLLOW_ME');

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition((pos) => {
      const u = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLoc(u);
      
      const R = 6371e3; // metres
      const φ1 = u.lat * Math.PI/180;
      const φ2 = spot.latitude * Math.PI/180;
      const Δφ = (spot.latitude - u.lat) * Math.PI/180;
      const Δλ = (spot.longitude - u.lng) * Math.PI/180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const d = R * c;
      
      setDistance(d > 1000 ? `${(d/1000).toFixed(2)}km` : `${Math.floor(d)}m`);
      setEta(Math.ceil(d / 1.4 / 60));

      const y = Math.sin(Δλ) * Math.cos(φ2);
      const x = Math.cos(φ1) * Math.sin(φ2) -
                Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
      const brng = Math.atan2(y, x) * 180 / Math.PI;
      setHeading((brng + 360) % 360);
    }, () => {}, { enableHighAccuracy: true });
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, [spot.latitude, spot.longitude]);

  // Center logic: Show both if possible, but the simple iframe center follows one.
  const displayLat = trackingMode === 'FOLLOW_ME' ? userLoc?.lat : spot.latitude;
  const displayLng = trackingMode === 'FOLLOW_ME' ? userLoc?.lng : spot.longitude;
  const mapSrc = displayLat ? `https://maps.google.com/maps?q=${displayLat},${displayLng}&z=19&output=embed&layer=t` : '';

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden relative">
      {/* 1. TOP HUD */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex items-start justify-between">
        <button onClick={onBack} className="w-12 h-12 bg-slate-900/90 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white shadow-2xl active:scale-90 transition-all border border-white/10">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        
        <div className="flex flex-col items-end space-y-2">
           <div className="bg-blue-600 px-6 py-2 rounded-2xl shadow-2xl border border-blue-400/30 flex items-center space-x-3">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Live Internal Guide</span>
           </div>
           <div className="bg-slate-900/90 backdrop-blur-xl px-4 py-2 rounded-xl text-[9px] font-bold text-slate-400 uppercase tracking-widest border border-white/5">
              ETA: ~{eta} min walk
           </div>
        </div>
      </div>

      {/* 2. MAP COMPONENT */}
      <div className="flex-1 relative">
        {mapSrc ? (
          <iframe 
            src={mapSrc}
            width="100%" 
            height="100%" 
            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.8) contrast(1.2)' }} 
            allowFullScreen={false} 
            loading="lazy"
            title="In-App Navigation"
            className="scale-110"
          ></iframe>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
             <i className="fa-solid fa-satellite-dish text-4xl text-blue-600 animate-pulse"></i>
          </div>
        )}

        {/* Marker HUD Layer */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
           <div className="w-64 h-64 border-2 border-dashed border-blue-600/20 rounded-full animate-spin-slow"></div>
        </div>
        
        <div className="absolute bottom-40 left-6 right-6 z-50 flex justify-between">
           <button 
            onClick={() => setTrackingMode('FOLLOW_ME')} 
            className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${trackingMode === 'FOLLOW_ME' ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-900/80 text-slate-400 border-white/10'}`}
           >
             <i className="fa-solid fa-person-walking mr-2"></i> Track Me
           </button>
           <button 
            onClick={() => setTrackingMode('FOLLOW_CAR')} 
            className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${trackingMode === 'FOLLOW_CAR' ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-900/80 text-slate-400 border-white/10'}`}
           >
             <i className={`fa-solid ${vehicle.icon} mr-2`}></i> Target Asset
           </button>
        </div>
      </div>

      {/* 3. TACTICAL DECK */}
      <div className="bg-slate-900 border-t border-white/10 p-8 pb-12 rounded-t-[3.5rem] shadow-[0_-20px_100px_rgba(0,0,0,0.5)] z-[60]">
         <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Locked Target</p>
               <h3 className="text-xl font-black italic uppercase tracking-tighter">{vehicle.name}</h3>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">PROXIMITY</p>
               <h3 className="text-3xl font-black tabular-nums">{distance}</h3>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center">
               <div 
                 className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center mb-3 transition-transform duration-500"
                 style={{ transform: `rotate(${heading}deg)` }}
               >
                 <i className="fa-solid fa-location-arrow text-blue-500 text-xl"></i>
               </div>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">AZIMUTH</span>
               <span className="font-mono text-sm mt-1 font-bold">{Math.floor(heading)}°</span>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center">
               <i className="fa-solid fa-person-walking text-green-500 mb-3 text-xl"></i>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">GUIDANCE</span>
               <span className="font-mono text-sm mt-1 font-bold italic">INTERNAL</span>
            </div>
         </div>
      </div>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 15s linear infinite; }
      `}</style>
    </div>
  );
};

export default PathfinderView;
