
export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  emergencyMobile?: string;
  isLoggedIn: boolean;
  avatar?: string;
  provider?: 'google' | 'microsoft' | 'email';
}

export interface Vehicle {
  id: string;
  name: string; // Nickname
  brand: string;
  model: string;
  plateNumber: string;
  icon: string;
  type: 'sedan' | 'suv' | 'ev' | 'truck' | 'bike';
  color: string;
}

export interface HealthLog {
  id: string;
  vehicleId: string;
  timestamp: number;
  description: string;
  category: 'engine' | 'tyres' | 'battery' | 'general' | 'fuel';
  aiAnalysis?: string;
}

export interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  number: string;
  icon: string;
}

export interface ParkingSpot {
  id: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  area?: string;
  note?: string;
  photoDatas: string[];
  mapSnapshot?: string; // Base64 or URL of static map for offline use
  parkedAt: number;
  reminderAt?: number;
  isActive: boolean;
  landmarks?: string[];
  hourlyRate?: number;
  fixedRate?: number;
  feeType?: 'free' | 'hourly' | 'fixed';
  meterLimitMinutes?: number;
  fuelLevel?: number;
  weatherNote?: string;
  safetyNote?: string;
  wearableSynced?: boolean;
  isLiveShared?: boolean;
}

export type ViewState = 'AUTH' | 'HOME' | 'DETAILS' | 'HISTORY' | 'VEHICLES' | 'NEARBY' | 'MAP_PICKER' | 'PATHFINDER' | 'AI_ASSISTANT' | 'SOS' | 'DASHBOARD' | 'PROFILE';
