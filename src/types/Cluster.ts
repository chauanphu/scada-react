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
  is_on: boolean;
  is_auto: boolean;
  is_connected: boolean;
  power: number;
  current: number;
  voltage: number;
  latitude?: number;
  longitude?: number;
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