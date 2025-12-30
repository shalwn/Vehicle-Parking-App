
import React, { useState, useEffect, useCallback } from 'react';
import { ParkingSpot, ViewState, Vehicle, User } from './types';
import * as DB from './db';
import HomeView from './components/HomeView';
import DetailsView from './components/DetailsView';
import HistoryView from './components/HistoryView';
import VehicleView from './components/VehicleView';
import NearbyView from './components/NearbyView';
import AuthView from './components/AuthView';
import MapPickerView from './components/MapPickerView';
import PathfinderView from './components/PathfinderView';
import AiAssistant from './components/AiAssistant';
import SosView from './components/SosView';
import DashboardView from './components/DashboardView';
// Rename import to avoid collision with browser Notification API
import AppNotification from './components/Notification';
import ProfileView from './components/ProfileView';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('AUTH');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [activeSpots, setActiveSpots] = useState<Record<string, ParkingSpot>>({});
  const [history, setHistory] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [reminder, setReminder] = useState<{message: string, type: 'info' | 'success'} | null>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    const v = DB.getVehicles();
    const s = DB.getActiveSpots();
    const h = DB.getHistory();
    const savedTheme = localStorage.getItem('parked_theme');
    const savedUser = localStorage.getItem('parked_user');
    
    setVehicles(v);
    setActiveSpots(s);
    setHistory(h);
    setSelectedVehicleId(v[0]?.id || '');
    setIsDarkMode(savedTheme === 'dark');
    
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setView('HOME');
    }

    navigator.geolocation.getCurrentPosition((pos) => {
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    }, () => {}, { enableHighAccuracy: false });
    
    // Request notification permission on boot using the native browser API
    if ("Notification" in window && window.Notification.permission === "default") {
      window.Notification.requestPermission();
    }

    setLoading(false);
  }, []);

  // Reminder checking loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      Object.values(activeSpots).forEach(spot => {
        if (spot.reminderAt && spot.reminderAt <= now) {
          const vehicle = vehicles.find(v => v.id === spot.vehicleId);
          const msg = `Parking Reminder: ${vehicle?.name || 'Your car'} session is reaching its limit!`;
          
          // Trigger In-App Notification
          showNotification(msg, 'info');
          
          // Trigger Browser Notification using the native constructor
          if ("Notification" in window && window.Notification.permission === "granted") {
            new window.Notification("Parked! Alert", {
              body: msg,
              icon: "/favicon.ico"
            });
          }

          // Clear reminder once triggered to prevent duplicate alerts
          updateActiveSpotById(spot.vehicleId, { reminderAt: undefined });
        }
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [activeSpots, vehicles]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('parked_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('parked_theme', 'light');
    }
  }, [isDarkMode]);

  const showNotification = (message: string, type: 'info' | 'success' = 'info') => {
    setReminder({ message, type });
    setTimeout(() => setReminder(null), 4000);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('parked_user', JSON.stringify(user));
    setView('HOME');
    showNotification(`Welcome, ${user.name}!`, 'success');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('parked_user', JSON.stringify(updatedUser));
    showNotification("Profile Data Synced", "success");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('parked_user');
    setView('AUTH');
  };

  const handleSaveParking = useCallback((manualCoords?: {lat: number, lng: number}) => {
    if (activeSpots[selectedVehicleId] && !manualCoords) {
      setView('DETAILS');
      return;
    }

    setLoading(true);
    const finalize = (lat: number, lng: number) => {
      const newSpot: ParkingSpot = {
        id: Date.now().toString(),
        vehicleId: selectedVehicleId,
        latitude: lat,
        longitude: lng,
        parkedAt: Date.now(),
        isActive: true,
        photoDatas: [],
      };
      DB.saveActiveSpot(newSpot);
      setActiveSpots(prev => ({ ...prev, [selectedVehicleId]: newSpot }));
      setView('DETAILS');
      setLoading(false);
      showNotification("Asset Position Locked", "success");
    };

    if (manualCoords) {
      finalize(manualCoords.lat, manualCoords.lng);
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => finalize(pos.coords.latitude, pos.coords.longitude),
        () => { alert("Location denied"); setLoading(false); },
        { enableHighAccuracy: true }
      );
    }
  }, [activeSpots, selectedVehicleId]);

  const handleClearParking = useCallback((vId: string) => {
    DB.clearActiveSpot(vId);
    const updatedSpots = { ...activeSpots };
    delete updatedSpots[vId];
    setActiveSpots(updatedSpots);
    setHistory(DB.getHistory());
    setView('HOME');
    showNotification("Spot Cleared.");
  }, [activeSpots]);

  const updateActiveSpot = useCallback((updates: Partial<ParkingSpot>) => {
    const current = activeSpots[selectedVehicleId];
    if (!current) return;
    const updated = { ...current, ...updates };
    DB.saveActiveSpot(updated);
    setActiveSpots(prev => ({ ...prev, [selectedVehicleId]: updated }));
  }, [activeSpots, selectedVehicleId]);

  const updateActiveSpotById = useCallback((vId: string, updates: Partial<ParkingSpot>) => {
    const current = activeSpots[vId];
    if (!current) return;
    const updated = { ...current, ...updates };
    DB.saveActiveSpot(updated);
    setActiveSpots(prev => ({ ...prev, [vId]: updated }));
  }, [activeSpots]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">Syncing Command Systems...</p>
      </div>
    );
  }

  const activeSpot = activeSpots[selectedVehicleId];
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col relative bg-gray-50 dark:bg-slate-950 font-sans shadow-2xl transition-all duration-500 overflow-x-hidden">
      {/* Updated to use renamed AppNotification component to avoid global naming conflict */}
      <AppNotification reminder={reminder} onClose={() => setReminder(null)} />
      
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {view === 'AUTH' && <AuthView onLogin={handleLogin} />}
        {view === 'HOME' && (
          <HomeView 
            activeSpot={activeSpot} 
            selectedVehicle={selectedVehicle}
            vehicles={vehicles}
            isDarkMode={isDarkMode}
            currentUser={currentUser}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            onSelectVehicle={setSelectedVehicleId}
            onSave={() => handleSaveParking()} 
            onManualSelect={() => setView('MAP_PICKER')}
            onViewDetails={() => setView('DETAILS')}
            onManageVehicles={() => setView('VEHICLES')}
            onFindParking={() => setView('NEARBY')}
            onLogout={handleLogout}
            onOpenAi={() => setView('AI_ASSISTANT')}
            onHistory={() => setView('HISTORY')}
            onSos={() => setView('SOS')}
            onProfile={() => setView('PROFILE')}
            showNotification={showNotification}
          />
        )}
        {view === 'MAP_PICKER' && (
          <MapPickerView 
            onConfirm={(c) => handleSaveParking(c)}
            onBack={() => setView('HOME')}
          />
        )}
        {view === 'DETAILS' && activeSpot && (
          <DetailsView 
            spot={activeSpot} 
            vehicle={selectedVehicle}
            onUpdate={updateActiveSpot}
            onClear={() => handleClearParking(selectedVehicleId)}
            onBack={() => setView('HOME')}
            onStartNativeWalk={() => setView('PATHFINDER')}
            showNotification={showNotification}
          />
        )}
        {view === 'PATHFINDER' && activeSpot && (
          <PathfinderView 
            spot={activeSpot}
            vehicle={selectedVehicle}
            onBack={() => setView('DETAILS')}
          />
        )}
        {view === 'AI_ASSISTANT' && (
          <AiAssistant onBack={() => setView('HOME')} latLng={coords} />
        )}
        {view === 'VEHICLES' && (
          <VehicleView 
            vehicles={vehicles} 
            onUpdate={(v) => { setVehicles(v); DB.saveVehicles(v); }}
            onBack={() => setView('HOME')} 
          />
        )}
        {view === 'NEARBY' && <NearbyView onBack={() => setView('HOME')} />}
        {history && view === 'HISTORY' && <HistoryView history={history} onBack={() => setView('HOME')} />}
        {view === 'SOS' && <SosView activeSpot={activeSpot} onBack={() => setView('HOME')} />}
        {view === 'DASHBOARD' && <DashboardView vehicles={vehicles} history={history} activeSpots={activeSpots} onBack={() => setView('HOME')} />}
        {view === 'PROFILE' && currentUser && (
          <ProfileView 
            user={currentUser} 
            vehicles={vehicles}
            onUpdate={handleUpdateUser} 
            onBack={() => setView('HOME')} 
          />
        )}
      </main>

      {view !== 'AUTH' && !['MAP_PICKER', 'PATHFINDER', 'AI_ASSISTANT'].includes(view) && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border-t border-slate-100 dark:border-slate-800 safe-area-bottom flex justify-around items-center h-20 max-w-md mx-auto z-40 px-2">
          <button onClick={() => setView('HOME')} className={`flex flex-col items-center flex-1 transition-all ${view === 'HOME' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
            <i className="fa-solid fa-gauge-high text-lg mb-1"></i>
            <span className="text-[7px] font-black uppercase tracking-widest italic">Hub</span>
          </button>
          <button onClick={() => setView('NEARBY')} className={`flex flex-col items-center flex-1 transition-all ${view === 'NEARBY' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
            <i className="fa-solid fa-radar text-lg mb-1"></i>
            <span className="text-[7px] font-black uppercase tracking-widest italic">Radar</span>
          </button>
          <button onClick={() => setView('DASHBOARD')} className={`flex flex-col items-center flex-1 transition-all ${view === 'DASHBOARD' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
            <i className="fa-solid fa-chart-pie text-lg mb-1"></i>
            <span className="text-[7px] font-black uppercase tracking-widest italic">Stats</span>
          </button>
          <button onClick={() => setView('SOS')} className={`flex flex-col items-center flex-1 transition-all ${view === 'SOS' ? 'text-red-600 scale-110' : 'text-slate-400'}`}>
            <i className="fa-solid fa-phone-volume text-lg mb-1"></i>
            <span className="text-[7px] font-black uppercase tracking-widest italic">SOS</span>
          </button>
          <button onClick={() => setView('PROFILE')} className={`flex flex-col items-center flex-1 transition-all ${view === 'PROFILE' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
            <i className="fa-solid fa-user-gear text-lg mb-1"></i>
            <span className="text-[7px] font-black uppercase tracking-widest italic">Profile</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;
