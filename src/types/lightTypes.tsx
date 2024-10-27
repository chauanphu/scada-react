export type Schedule = {
  on: string;  
  off: string;  
}

export type LightBulb = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isOn: boolean;
  isConnected: boolean;
  powerUsage: number;    
  voltage: number;   
  amperage: number;
  schedule: Schedule;    
}

export type District = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  numberOfLights: number;
  lightBulbs: LightBulb[];
}
