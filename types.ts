
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
  name: string;
  model: string;
  plateNumber: string;
  icon: string;
  type: 'sedan' | 'suv' | 'ev' | 'truck' | 'bike';
  color: string;
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
