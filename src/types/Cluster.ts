export interface Device {
  _id: string;
  name: string;
  mac: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
  latitude?: number;
  longitude?: number;
  auto?: boolean;
  schedule?: Schedule;
}

export interface DeviceStatus {
  is_connected: boolean;
  mac: string;
  device_id: string;
  timestamp: string;
  voltage: number;
  current: number;
  power: number;
  power_factor: number;
  total_energy: number;
  toggle: boolean;
  device_name: string;
  auto: boolean;
  hour_on: number;
  hour_off: number;
  minute_on: number;
  minute_off: number;
  latitude?: number;
  longitude?: number;
  tenant_id: string;
  schedule?: Schedule;
}

export interface Schedule {
  hour_on: number;
  minute_on: number;
  hour_off: number;
  minute_off: number;
  days: number[];
}

export interface CreateDeviceData {
  name: string;
  mac: string;
  latitude?: number;
  longitude?: number;
  auto?: boolean;
  schedule?: Schedule;
} 