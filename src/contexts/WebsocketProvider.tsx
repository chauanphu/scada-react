import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAPI } from "./APIProvider";
import { getDevices, NEXT_PUBLIC_WS_URL, setCommand } from "../lib/api";
import { Device, Schedule, DeviceStatus } from "../types/Cluster";
import { useToast } from './ToastProvider';

interface WebSocketContextType {
  devices: Device[];
  deviceStatuses: { [key: string]: DeviceStatus };
  selectedDevice: Device | null;
  setSelectedDevice: React.Dispatch<React.SetStateAction<Device | null>>;
  toggleDevice: (deviceId: string) => Promise<void>;
  toggleAutomatic: (deviceId: string) => void;
  disableAutomatic: (deviceId: string) => void;
  sendCommand: (deviceId: string, type: "toggle" | "schedule" | "auto", payload: boolean | Schedule) => Promise<void>;
  sendMessage: (deviceId: string, message: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const apiContext = useAPI();
  const token = apiContext?.token || "";
  const isAuthenticated = apiContext?.isAuthenticated;
  const [devices, setDevices] = useState<Device[]>([]);
  const [sockets, setSockets] = useState<Map<string, WebSocket>>(new Map());
  const [deviceStatuses, setDeviceStatus] = useState<{ [key: string]: DeviceStatus }>({});
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDevices(token);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (isAuthenticated && token && devices.length > 0) {
      const newSockets = new Map<string, WebSocket>();
      devices.forEach((device) => {
        const ws = connectWebSocket(device._id);
        newSockets.set(device._id, ws);
      });
      setSockets(newSockets);

      return () => {
        newSockets.forEach((ws) => ws.close());
      };
    }
  }, [isAuthenticated, token, devices]);

  useEffect(() => {
    if (!apiContext?.token) return;

    const ws = new WebSocket(`${NEXT_PUBLIC_WS_URL}/ws?token=${apiContext.token}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      addToast('success', 'Connected to server');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      addToast('error', 'Disconnected from server');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      addToast('error', 'Connection error');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (!data) return;

      setDeviceStatus((prevState) => ({
        ...prevState,
        [data.device_id]: {
          ...prevState[data.device_id],
          ...data,
        },
      }));
    };

    return () => {
      ws.close();
    };
  }, [apiContext?.token, addToast]);

  const connectWebSocket = (deviceId: string) => {
    const ws = new WebSocket(
      `${NEXT_PUBLIC_WS_URL}/ws/devices/${deviceId}?token=${token}`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (!data) return;

      setDeviceStatus((prevState) => ({
        ...prevState,
        [deviceId]: {
          ...prevState[deviceId],
          ...data,
        },
      }));
    };

    return ws;
  };

  const fetchDevices = async (token: string) => {
    const data = await getDevices(token);
    setDevices(data);
  };

  const sendMessage = (deviceId: string, message: string) => {
    const ws = sockets.get(deviceId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ message }));
    } else {
      console.warn(`WebSocket for device ${deviceId} is not open.`);
    }
  };

  const toggleDevice = async (deviceId: string) => {
    const status = deviceStatuses[deviceId];
    if (status) {
      await setCommand(token, deviceId, "toggle", !status.is_on);
      setDeviceStatus((prevState) => ({
        ...prevState,
        [deviceId]: { ...status, is_on: !status.is_on, is_auto: false },
      }));
    }
  };

  const disableAutomatic = (deviceId: string) => {
    const status = deviceStatuses[deviceId];
    if (status) {
      setDeviceStatus((prevState) => ({
        ...prevState,
        [deviceId]: { ...status, is_auto: false },
      }));
    }
  };

  const toggleAutomatic = (deviceId: string) => {
    const status = deviceStatuses[deviceId];
    if (status) {
      setDeviceStatus((prevState) => ({
        ...prevState,
        [deviceId]: { ...status, is_auto: !status.is_auto },
      }));
    }
  };

  const sendCommand = async (deviceId: string, type: "toggle" | "schedule" | "auto", payload: boolean | Schedule) => {
    await setCommand(token, deviceId, type, payload);
    const status = deviceStatuses[deviceId];
    if (status) {
      setDeviceStatus((prevState) => ({
        ...prevState,
        [deviceId]: {
          ...status,
          ...(type === "toggle" && { is_on: payload as boolean, is_auto: false }),
          ...(type === "auto" && { is_auto: payload as boolean }),
          ...(type === "schedule" && { schedule: payload as Schedule }),
        },
      }));
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        devices,
        deviceStatuses,
        selectedDevice,
        setSelectedDevice,
        toggleDevice,
        toggleAutomatic,
        disableAutomatic,
        sendCommand,
        sendMessage,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);