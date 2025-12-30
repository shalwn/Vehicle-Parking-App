
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

  const makeCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  const navigateWith = (provider: string) => {
    let url = '';
    const { latitude: lat, longitude: lng } = spot;
    if (provider === 'google') url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
    if (provider === 'waze') url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    if (provider === 'apple') url = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`;
    window.open(url, '_blank');
    setShowNavOptions(false);
  };

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onloadend = () => {
        const photos = spot.photoDatas || [];
        onUpdate({ photoDatas: [...photos, r.result as string] });
        showNotification("Photo Intelligence Saved", "success");
      };
      r.readAsDataURL(f);
    }
  };

  const handleSetReminder = (minutes: number) => {
    const reminderAt = Date.now() + minutes * 60000;
    onUpdate({ reminderAt });
    showNotification(`Reminder set for ${minutes} min`, 'success');
    
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  };

  const remainingReminderText = useMemo(() => {
    if (!spot.reminderAt) return null;
    const diff = spot.reminderAt - currentTime;
    if (diff <= 0) return "Triggered";
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}m ${s}s left`;
  }, [spot.reminderAt, currentTime]);

  return (
    <div className="flex flex-col min-h-full pb-44 relative bg-slate-50 dark:bg-slate-950">
      {/* HUD HEADER */}
      <div className="sticky top-0 z-40 px-6 py-6 bg-white dark:bg-slate-900 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <button onClick={onBack} className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center active:scale-90 transition-all">
          <i className="fa-solid fa-chevron-left text-slate-900 dark:text-white"></i>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Target Tracking</span>
          <h2 className="font-black text-slate-900 dark:text-white text-lg italic uppercase">{vehicle.plateNumber}</h2>
        </div>
        <button onClick={() => setShowEmergency(true)} className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center active:scale-90 shadow-xl animate-pulse">
          <i className="fa-solid fa-phone-volume"></i>
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* COMPASS STATS */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center relative overflow-hidden">
           <div className="w-full flex justify-between mb-8">
             <div className="space-y-1">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Azimuth</p>
               <p className="text-3xl font-black text-slate-900 dark:text-white italic tabular-nums">{bearing ? Math.floor(bearing) : '--'}°</p>
             </div>
             <div className="text-right space-y-1">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parking Time</p>
               <p className="text-3xl font-black text-blue-600 tabular-nums">{formatTime(durationMs)}</p>
             </div>
           </div>
           
           <div className="relative w-44 h-44 flex items-center justify-center border-4 border-slate-50 dark:border-slate-800 rounded-full shadow-inner bg-slate-50/50 dark:bg-slate-800/20">
              <div 
                className="w-2 h-32 bg-blue-600 rounded-full transition-transform duration-1000 ease-out flex flex-col items-center shadow-lg"
                style={{ transform: `rotate(${bearing || 0}deg)` }}
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full border-2 border-white -mt-4 shadow-xl flex items-center justify-center">
                   <i className={`fa-solid ${vehicle.icon} text-white text-[10px]`}></i>
                </div>
              </div>
              <span className="absolute top-2 text-[10px] font-black text-slate-300 dark:text-slate-600">N</span>
              <span className="absolute bottom-2 text-[10px] font-black text-slate-300 dark:text-slate-600">S</span>
           </div>
        </div>

        {/* REMINDER SECTION */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800">
           <div className="flex justify-between items-center mb-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Reminder Protocol</h4>
              {remainingReminderText && (
                <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full animate-pulse">{remainingReminderText}</span>
              )}
           </div>
           <div className="grid grid-cols-3 gap-3">
              {[30, 60, 120].map((m) => (
                <button 
                  key={m}
                  onClick={() => handleSetReminder(m)}
                  className="bg-slate-50 dark:bg-slate-800 py-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center space-y-1 active:scale-95 transition-all"
                >
                  <span className="text-sm font-black dark:text-white">{m === 120 ? '2h' : `${m}m`}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Delay</span>
                </button>
              ))}
           </div>
           {spot.reminderAt && (
             <button 
               onClick={() => onUpdate({ reminderAt: undefined })}
               className="w-full mt-4 py-3 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/10 rounded-xl"
             >
               Disable Active Reminder
             </button>
           )}
        </div>

        {/* PARKING FEE TRACKER */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-4">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Parking Fee Estimator</h4>
             <button onClick={() => setIsEditingFee(!isEditingFee)} className="text-[10px] font-black text-blue-600 uppercase">Config</button>
          </div>
          
          {isEditingFee ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex space-x-2">
                {(['free', 'hourly', 'fixed'] as const).map((t) => (
                  <button 
                    key={t}
                    onClick={() => onUpdate({ feeType: t })}
                    className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${spot.feeType === t ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {spot.feeType === 'hourly' && (
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-slate-500">Rate (₹/hr):</span>
                  <input 
                    type="number"
                    value={spot.hourlyRate || 0}
                    onChange={(e) => onUpdate({ hourlyRate: parseInt(e.target.value) || 0 })}
                    className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}
              {spot.feeType === 'fixed' && (
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-slate-500">Fixed (₹):</span>
                  <input 
                    type="number"
                    value={spot.fixedRate || 0}
                    onChange={(e) => onUpdate({ fixedRate: parseInt(e.target.value) || 0 })}
                    className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}
              <button onClick={() => setIsEditingFee(false)} className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Apply Config</button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900 dark:text-white italic">₹{calculatedFee}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Current Charges</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  {spot.feeType === 'hourly' ? `₹${spot.hourlyRate}/hr` : spot.feeType === 'fixed' ? `₹${spot.fixedRate} Fixed` : 'Gratis'}
                </span>
                <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Pricing Model</p>
              </div>
            </div>
          )}
        </div>

        {/* NAVIGATION ACTION GRID */}
        <div className="grid grid-cols-2 gap-4">
           <button onClick={onStartNativeWalk} className="bg-blue-600 text-white p-7 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center space-y-3 active:scale-95 transition-all border-b-4 border-blue-800">
              <i className="fa-solid fa-person-walking text-3xl"></i>
              <span className="text-[11px] font-black uppercase tracking-widest italic">Live Guide</span>
           </button>
           <button onClick={() => setShowNavOptions(true)} className="bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-3 active:scale-95 transition-all">
              <i className="fa-solid fa-map-location-dot text-3xl text-blue-600"></i>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 italic">GPS Link</span>
           </button>
        </div>

        {/* NOTES */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800">
           <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Parking Context</h4>
              <button onClick={() => setIsEditingNote(!isEditingNote)} className="text-[10px] font-black text-blue-600 uppercase">Modify</button>
           </div>
           {isEditingNote ? (
             <textarea 
              autoFocus
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              onBlur={() => { onUpdate({ note: noteValue }); setIsEditingNote(false); }}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
              rows={3}
              placeholder="Floor, Row, Section details..."
             />
           ) : (
             <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed italic">
               {spot.note || "Tap edit to capture floor, pillar, or bay number details."}
             </p>
           )}
        </div>

        {/* MULTI-PHOTO GALLERY */}
        <div className="space-y-4">
           <div className="flex justify-between items-center px-2">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Visual Intel</h4>
             <label className="cursor-pointer bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center space-x-2">
               <i className="fa-solid fa-camera"></i>
               <span>Capture</span>
               <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleAddPhoto} />
             </label>
           </div>
           <div className="flex space-x-4 overflow-x-auto pb-6 no-scrollbar -mx-2 px-2">
              {(spot.photoDatas || []).map((p, i) => (
                <div key={i} className="relative shrink-0 w-64 h-48 rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl group">
                   <img src={p} alt="Evidence" className="w-full h-full object-cover" />
                   <button onClick={() => {
                     const updated = [...spot.photoDatas];
                     updated.splice(i, 1);
                     onUpdate({ photoDatas: updated });
                   }} className="absolute top-4 right-4 w-10 h-10 bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="fa-solid fa-trash-can text-xs"></i>
                   </button>
                </div>
              ))}
              {(spot.photoDatas || []).length === 0 && (
                <div className="w-full h-48 rounded-[2.5rem] border-4 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 italic text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-900/50">
                   <i className="fa-solid fa-camera-retro text-3xl mb-2"></i>
                   No photos captured
                </div>
              )}
           </div>
        </div>
      </div>

      {/* SOS EMERGENCY PANEL */}
      {showEmergency && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/90 backdrop-blur-lg p-6 animate-fade-in">
           <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 animate-slide-up shadow-4xl border border-red-500/20">
              <div className="flex justify-between items-center mb-10">
                 <div>
                   <h3 className="text-2xl font-black text-red-600 uppercase italic">Emergency SOS</h3>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Immediate response needed</p>
                 </div>
                 <button onClick={() => setShowEmergency(false)} className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center active:scale-90"><i className="fa-solid fa-xmark text-slate-400"></i></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 {EMERGENCY_SERVICES.map(s => (
                   <button 
                    key={s.id} 
                    onClick={() => makeCall(s.number)} 
                    className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center space-y-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95 group"
                   >
                      <i className={`fa-solid ${s.icon} text-3xl text-red-600 group-hover:scale-110 transition-transform`}></i>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white italic">{s.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 font-mono">{s.number}</span>
                      </div>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* DISPATCH DRAWER */}
      {showNavOptions && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
           <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 animate-slide-up shadow-4xl">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-xl font-black text-blue-600 uppercase italic">External Dispatch</h3>
                 <button onClick={() => setShowNavOptions(false)} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
              </div>
              <div className="space-y-4">
                 <button onClick={() => navigateWith('google')} className="w-full flex items-center justify-between p-7 bg-slate-50 dark:bg-slate-800 rounded-3xl group active:scale-[0.98] transition-all">
                    <div className="flex items-center space-x-5">
                       <i className="fa-brands fa-google text-blue-500 text-2xl"></i>
                       <span className="font-black text-[11px] uppercase tracking-widest dark:text-white italic">Google Intelligence</span>
                    </div>
                    <i className="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>
                 </button>
                 <button onClick={() => navigateWith('waze')} className="w-full flex items-center justify-between p-7 bg-slate-50 dark:bg-slate-800 rounded-3xl group active:scale-[0.98] transition-all">
                    <div className="flex items-center space-x-5">
                       <i className="fa-brands fa-waze text-cyan-400 text-2xl"></i>
                       <span className="font-black text-[11px] uppercase tracking-widest dark:text-white italic">Waze Traffic Live</span>
                    </div>
                    <i className="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>
                 </button>
              </div>
              <button onClick={() => setShowNavOptions(false)} className="w-full mt-8 py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Dismiss</button>
           </div>
        </div>
      )}

      <div className="fixed bottom-32 left-8 right-8 flex justify-center z-30">
        <button onClick={() => { if(confirm("Terminate this session?")) onClear(); }} className="text-red-500/50 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.5em] transition-all hover:scale-105 italic">ABORT SESSION</button>
      </div>

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default DetailsView;
