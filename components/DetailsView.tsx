
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ParkingSpot, Vehicle, EmergencyContact } from '../types';
import { EMERGENCY_SERVICES } from '../db';

interface DetailsViewProps {
  spot: ParkingSpot;
  vehicle: Vehicle;
  onUpdate: (updates: Partial<ParkingSpot>) => void;
  onClear: () => void;
  onBack: () => void;
  onStartNativeWalk: () => void;
  showNotification: (msg: string, type?: 'info' | 'success') => void;
}

const DetailsView: React.FC<DetailsViewProps> = ({ spot, vehicle, onUpdate, onClear, onBack, onStartNativeWalk, showNotification }) => {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(spot.note || '');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [bearing, setBearing] = useState<number | null>(null);
  const [showNavOptions, setShowNavOptions] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [isEditingFee, setIsEditingFee] = useState(false);
  const [customReminder, setCustomReminder] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
      updateBearing();
    }, 3000);
    return () => clearInterval(timer);
  }, [spot.latitude, spot.longitude]);

  const updateBearing = useCallback(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const uLat = pos.coords.latitude * (Math.PI / 180);
      const uLng = pos.coords.longitude * (Math.PI / 180);
      const sLat = spot.latitude * (Math.PI / 180);
      const sLng = spot.longitude * (Math.PI / 180);
      const y = Math.sin(sLng - uLng) * Math.cos(sLat);
      const x = Math.cos(uLat) * Math.sin(sLat) - Math.sin(uLat) * Math.cos(sLat) * Math.cos(sLng - uLng);
      setBearing(((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360);
    }, () => {}, { enableHighAccuracy: true });
  }, [spot.latitude, spot.longitude]);

  const durationMs = currentTime - spot.parkedAt;
  
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
  };

  const calculatedFee = useMemo(() => {
    if (spot.feeType === 'hourly') {
      const hours = Math.ceil(durationMs / 3600000);
      return (spot.hourlyRate || 0) * hours;
    }
    if (spot.feeType === 'fixed') {
      return spot.fixedRate || 0;
    }
    return 0;
  }, [spot.feeType, spot.hourlyRate, spot.fixedRate, durationMs]);

  const handleShare = async () => {
    const shareText = `My ${vehicle.brand} ${vehicle.model} is parked at: https://www.google.com/maps/search/?api=1&query=${spot.latitude},${spot.longitude}. Parked since ${new Date(spot.parkedAt).toLocaleTimeString()}. Note: ${spot.note || 'None'}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Parked! - Vehicle Location',
          text: shareText,
          url: window.location.href
        });
      } catch (e) {
        showNotification("Sharing aborted", "info");
      }
    } else {
      navigator.clipboard.writeText(shareText);
      showNotification("Details copied for sharing", "success");
    }
  };

  const handleSetReminder = (minutes: number) => {
    if (!minutes || minutes <= 0) return;
    const reminderAt = Date.now() + minutes * 60000;
    onUpdate({ reminderAt });
    showNotification(`Reminder armed for ${minutes} min`, 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onUpdate({ photoDatas: [...spot.photoDatas, base64] });
        showNotification("Visual Intel Saved", "success");
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const remainingReminderText = useMemo(() => {
    if (!spot.reminderAt) return null;
    const diff = spot.reminderAt - currentTime;
    if (diff <= 0) return "Alert Triggered";
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}m ${s}s remaining`;
  }, [spot.reminderAt, currentTime]);

  return (
    <div className="flex flex-col min-h-full pb-44 bg-slate-50 dark:bg-slate-950">
      {/* HEADER */}
      <div className="sticky top-0 z-40 px-6 py-6 bg-white dark:bg-slate-900 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <button onClick={onBack} className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
          <i className="fa-solid fa-chevron-left text-slate-900 dark:text-white"></i>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Target Registry</span>
          <h2 className="font-black text-slate-900 dark:text-white text-lg italic uppercase">{vehicle.plateNumber}</h2>
        </div>
        <button onClick={handleShare} className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center active:scale-90 shadow-lg">
          <i className="fa-solid fa-share-nodes"></i>
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* COMPASS STATS */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center relative overflow-hidden">
           <div className="w-full flex justify-between mb-8">
             <div className="space-y-1">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Azimuth</p>
               <p className="text-3xl font-black text-slate-900 dark:text-white italic tabular-nums">{bearing ? Math.floor(bearing) : '--'}°</p>
             </div>
             <div className="text-right space-y-1">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parked Time</p>
               <p className="text-3xl font-black text-blue-600 tabular-nums">{formatTime(durationMs)}</p>
             </div>
           </div>
           
           <div className="relative w-40 h-40 flex items-center justify-center border-4 border-slate-50 dark:border-slate-800 rounded-full shadow-inner bg-slate-50/50 dark:bg-slate-800/20">
              <div 
                className="w-2 h-32 bg-blue-600 rounded-full transition-transform duration-1000 ease-out flex flex-col items-center shadow-lg"
                style={{ transform: `rotate(${bearing || 0}deg)` }}
              >
                <div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-white -mt-3 shadow-xl"></div>
              </div>
           </div>
        </div>

        {/* PHOTO CAPTURE Intel */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800">
           <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Visual Intelligence</h4>
              <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90">
                 <i className="fa-solid fa-camera-retro"></i>
              </button>
              <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
           </div>
           
           {spot.photoDatas.length > 0 ? (
             <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
                {spot.photoDatas.map((p, i) => (
                  <div key={i} className="w-32 h-32 flex-none rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-lg">
                     <img src={p} alt={`Parking Intel ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
             </div>
           ) : (
             <p className="text-[9px] text-center font-bold text-slate-400 uppercase tracking-widest italic py-4">No visual records captured for this sector.</p>
           )}
        </div>

        {/* CUSTOM REMINDERS */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
           <div className="flex justify-between items-center mb-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Smart Alert Protocols</h4>
              {remainingReminderText && <span className="text-[9px] font-black text-orange-500 animate-pulse uppercase">{remainingReminderText}</span>}
           </div>
           <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map((m) => (
                <button key={m} onClick={() => handleSetReminder(m)} className="bg-slate-50 dark:bg-slate-800 py-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs font-black dark:text-white uppercase">{m}m</button>
              ))}
           </div>
           <div className="flex items-center space-x-2">
              <input 
                type="number" 
                placeholder="Custom minutes..."
                value={customReminder}
                onChange={(e) => setCustomReminder(e.target.value)}
                className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button onClick={() => { handleSetReminder(parseInt(customReminder)); setCustomReminder(''); }} className="bg-blue-600 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Set</button>
           </div>
           {spot.reminderAt && (
             <button onClick={() => onUpdate({ reminderAt: undefined })} className="w-full text-red-500 text-[9px] font-black uppercase tracking-widest opacity-50">Clear Active Alert</button>
           )}
        </div>

        {/* FEE ESTIMATOR */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-4">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Intelligence Fee Pack</h4>
             <button onClick={() => setIsEditingFee(!isEditingFee)} className="text-[9px] font-black text-blue-600 uppercase">Edit Logic</button>
          </div>
          
          {isEditingFee ? (
            <div className="space-y-3 animate-fade-in">
              <div className="flex space-x-1">
                {(['free', 'hourly', 'fixed'] as const).map((t) => (
                  <button key={t} onClick={() => onUpdate({ feeType: t })} className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase ${spot.feeType === t ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{t}</button>
                ))}
              </div>
              <input 
                type="number"
                placeholder="Rate (₹)..."
                value={spot.feeType === 'hourly' ? (spot.hourlyRate || '') : (spot.fixedRate || '')}
                onChange={(e) => spot.feeType === 'hourly' ? onUpdate({ hourlyRate: parseInt(e.target.value) }) : onUpdate({ fixedRate: parseInt(e.target.value) })}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl dark:text-white outline-none"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-3xl font-black text-slate-900 dark:text-white italic">₹{calculatedFee}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Est. Due</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{spot.feeType || 'free'} model</span>
              </div>
            </div>
          )}
        </div>

        {/* NAVIGATION ACTIONS */}
        <div className="grid grid-cols-2 gap-4">
           <button onClick={onStartNativeWalk} className="bg-blue-600 text-white p-7 rounded-[2.5rem] shadow-2xl flex flex-col items-center space-y-2 active:scale-95 transition-all">
              <i className="fa-solid fa-person-walking text-3xl"></i>
              <span className="text-[10px] font-black uppercase tracking-widest italic">Live Guide</span>
           </button>
           <button onClick={() => setShowNavOptions(true)} className="bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center space-y-2 active:scale-95 transition-all">
              <i className="fa-solid fa-map-location-dot text-3xl text-blue-600"></i>
              <span className="text-[10px] font-black uppercase tracking-widest italic dark:text-slate-400">GPS Logic</span>
           </button>
        </div>

        {/* NOTES */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800">
           <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Context Intel</h4>
              <button onClick={() => setIsEditingNote(!isEditingNote)} className="text-[9px] font-black text-blue-600 uppercase">{isEditingNote ? 'Apply' : 'Modify'}</button>
           </div>
           {isEditingNote ? (
             <textarea 
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              onBlur={() => { onUpdate({ note: noteValue }); setIsEditingNote(false); }}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl dark:text-white outline-none text-sm"
              rows={2}
             />
           ) : (
             <p className="text-sm font-bold text-slate-700 dark:text-slate-300 italic">{spot.note || "Add bay/floor details..."}</p>
           )}
        </div>
      </div>

      <div className="fixed bottom-32 left-8 right-8 flex justify-center z-30">
        <button onClick={() => confirm("Terminate session?") && onClear()} className="text-red-500/50 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.5em] italic">ABORT SESSION</button>
      </div>
      
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default DetailsView;
