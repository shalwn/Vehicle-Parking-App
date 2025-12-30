
import React, { useState, useEffect } from 'react';

interface MapPickerViewProps {
  onConfirm: (coords: {lat: number, lng: number}) => void;
  onBack: () => void;
}

const MapPickerView: React.FC<MapPickerViewProps> = ({ onConfirm, onBack }) => {
  const [center, setCenter] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    }, () => {
      setCenter({ lat: 37.7749, lng: -122.4194 }); // Fallback to SF
    });
  }, []);

  const mapSrc = center ? `https://maps.google.com/maps?q=${center.lat},${center.lng}&z=18&output=embed` : '';

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      <div className="absolute top-0 left-0 right-0 z-50 px-6 py-8 flex items-center justify-between pointer-events-none">
        <button onClick={onBack} className="w-12 h-12 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-900 dark:text-white shadow-2xl pointer-events-auto active:scale-90 transition-all border border-white/20">
          <i className="fa-solid fa-xmark"></i>
        </button>
        <div className="bg-blue-600/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl pointer-events-auto border border-blue-400/20">
           <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Manual Selection</h2>
        </div>
        <div className="w-12"></div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {center ? (
          <iframe 
            src={mapSrc}
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen={false} 
            loading="lazy"
            title="Manual Picker Map"
          ></iframe>
        ) : (
          <div className="h-full bg-slate-900 flex items-center justify-center">
             <i className="fa-solid fa-satellite-dish text-blue-600 text-4xl animate-pulse"></i>
          </div>
        )}

        {/* Crosshair Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
           <div className="relative">
              <div className="w-12 h-12 border-2 border-blue-600 rounded-full flex items-center justify-center">
                 <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
              </div>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-blue-600"></div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-blue-600"></div>
              <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-4 h-0.5 bg-blue-600"></div>
              <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-4 h-0.5 bg-blue-600"></div>
           </div>
        </div>
      </div>

      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-8 rounded-t-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.2)] border-t border-white/20 dark:border-slate-800">
         <p className="text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 italic leading-relaxed">
           Align crosshair with your exact parking position.<br/>Works best for multi-level structures.
         </p>
         <button 
          onClick={() => center && onConfirm(center)}
          className="w-full py-7 bg-blue-600 text-white font-black rounded-[2rem] shadow-3xl shadow-blue-600/30 flex items-center justify-center space-x-4 active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-sm italic"
         >
           <i className="fa-solid fa-check-double text-xl"></i>
           <span>Confirm Current View</span>
         </button>
      </div>
    </div>
  );
};

export default MapPickerView;
