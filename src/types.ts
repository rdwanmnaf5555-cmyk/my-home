export interface LightStatus {
  id: number;
  name: string;
  isOn: boolean;
}

export interface RoomData {
  id: string;
  name: string;
  lights: LightStatus[];
  currentAmperes: number;
  lastUpdate: string;
}

export interface SmartHomeState {
  rooms: Record<string, RoomData>;
  alertThreshold: number;
}

export interface ControlCommand {
  roomId: string;
  lightId: number;
  action: 'ON' | 'OFF' | 'TOGGLE';
}
