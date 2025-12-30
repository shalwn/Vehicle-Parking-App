
import { ParkingSpot, Vehicle, EmergencyContact, HealthLog } from './types';

const STORAGE_KEY = 'parked_app_v2';

const DEFAULT_VEHICLES: Vehicle[] = [
  { 
    id: 'v1', 
    name: 'Main Ride', 
    brand: 'Tesla',
    model: 'Model 3', 
    plateNumber: 'MH-12-PA-777', 
    icon: 'fa-car-side', 
    type: 'ev',
    color: '#3b82f6' 
  }
];

export const EMERGENCY_SERVICES: EmergencyContact[] = [
  { id: '1', name: 'POLICE', role: 'Security', number: '100', icon: 'fa-shield-halved' },
  { id: '2', name: 'FIRE DEPT', role: 'Rescue', number: '101', icon: 'fa-fire-extinguisher' },
  { id: '3', name: 'AMBULANCE', role: 'Medical', number: '102', icon: 'fa-truck-medical' },
  { id: '4', name: 'EMERGENCY (ALL)', role: 'Panic Support', number: '112', icon: 'fa-triangle-exclamation' }
];

export const getVehicles = (): Vehicle[] => {
  const data = localStorage.getItem(STORAGE_KEY + '_vehicles');
  return data ? JSON.parse(data) : DEFAULT_VEHICLES;
};

export const saveVehicles = (vehicles: Vehicle[]): void => {
  localStorage.setItem(STORAGE_KEY + '_vehicles', JSON.stringify(vehicles));
};

export const getActiveSpots = (): Record<string, ParkingSpot> => {
  const data = localStorage.getItem(STORAGE_KEY + '_active_spots');
  return data ? JSON.parse(data) : {};
};

export const saveActiveSpot = (spot: ParkingSpot): void => {
  const spots = getActiveSpots();
  spots[spot.vehicleId] = spot;
  localStorage.setItem(STORAGE_KEY + '_active_spots', JSON.stringify(spots));
};

export const clearActiveSpot = (vehicleId: string): void => {
  const spots = getActiveSpots();
  const spot = spots[vehicleId];
  if (spot) {
    const history = getHistory();
    history.unshift({ ...spot, isActive: false });
    localStorage.setItem(STORAGE_KEY + '_history', JSON.stringify(history.slice(0, 50)));
    delete spots[vehicleId];
    localStorage.setItem(STORAGE_KEY + '_active_spots', JSON.stringify(spots));
  }
};

export const getHistory = (): ParkingSpot[] => {
  const data = localStorage.getItem(STORAGE_KEY + '_history');
  return data ? JSON.parse(data) : [];
}

export const getHealthLogs = (vehicleId: string): HealthLog[] => {
  const data = localStorage.getItem(STORAGE_KEY + '_health_' + vehicleId);
  return data ? JSON.parse(data) : [];
}

export const addHealthLog = (log: HealthLog): void => {
  const logs = getHealthLogs(log.vehicleId);
  logs.unshift(log);
  localStorage.setItem(STORAGE_KEY + '_health_' + log.vehicleId, JSON.stringify(logs.slice(0, 100)));
}
