import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { useAPI } from "./APIProvider";
import { Device, DeviceStatus } from "../types/Cluster";
import { PUBLIC_WS_URL } from "../lib/api";
import { useToast } from './ToastProvider';

interface WebSocketContextType {
  devices: Device[];
  deviceStatuses: { [key: string]: DeviceStatus };
  selectedDevice: Device | null;
  setSelectedDevice: React.Dispatch<React.SetStateAction<Device | null>>;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const apiContext = useAPI();
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceStatuses, setDeviceStatus] = useState<{ [key: string]: DeviceStatus }>({});
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { addToast } = useToast();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const isFirstConnectRef = useRef(true);
  const connectionAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const handleDeviceStatus = useCallback((deviceStatus: DeviceStatus) => {
    if (!deviceStatus?.device_id) return;

    // console.log('Processing device status:', deviceStatus);

    // Update device status
    setDeviceStatus(prev => ({
      ...prev,
      [deviceStatus.device_id]: {
        ...deviceStatus,
        is_connected: true,
      }
    }));

    // Update device info in devices list
    setDevices(prev => {
      const index = prev.findIndex(d => d._id === deviceStatus.device_id);
      if (index === -1) return prev;

      const updatedDevices = [...prev];
      const currentDevice = updatedDevices[index];

      // Only update coordinates if they're provided and different
      if (
        deviceStatus.latitude !== undefined &&
        deviceStatus.longitude !== undefined &&
        (deviceStatus.latitude !== currentDevice.latitude ||
          deviceStatus.longitude !== currentDevice.longitude)
      ) {
        // console.log(`Updating coordinates for device ${currentDevice._id}:`, {
        //   lat: deviceStatus.latitude,
        //   lng: deviceStatus.longitude
        // });

        updatedDevices[index] = {
          ...currentDevice,
          latitude: deviceStatus.latitude,
          longitude: deviceStatus.longitude,
          name: deviceStatus.device_name || currentDevice.name,
        };
        return updatedDevices;
      }

      return prev;
    });
  }, []);

  const fetchDevices = useCallback(async () => {
    if (!apiContext?.token) return;

    try {
      const data = await apiContext.getDevices();
      setDevices(data);
    } catch (err) {

      console.error('Error fetching devices:', err);
      addToast('error', 'Could not load devices');
    }
  }, [apiContext, addToast]);

  const connectWebSocket = useCallback(() => {
    if (!apiContext?.token || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `${PUBLIC_WS_URL}/api/ws/monitor/?token=${apiContext.token}`;
    // console.log('Connecting to WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // console.log('WebSocket connected successfully');
      connectionAttemptsRef.current = 0;
      if (isFirstConnectRef.current) {
        isFirstConnectRef.current = false;
        fetchDevices();
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event);
      wsRef.current = null;

      // Attempt reconnection if we have a selected device and haven't exceeded max attempts
      if (!reconnectTimeoutRef.current && selectedDevice && connectionAttemptsRef.current < maxReconnectAttempts) {
        connectionAttemptsRef.current++;
        const delay = Math.min(1000 * Math.pow(2, connectionAttemptsRef.current), 30000);

        // console.log(`Reconnect attempt ${connectionAttemptsRef.current} in ${delay}ms`);

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = undefined;
          connectWebSocket();
        }, delay);
      }
    };

    ws.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event: MessageEvent) => {
      let messageArray: unknown;
      try {
        messageArray = JSON.parse(event.data);
        if (!Array.isArray(messageArray) || messageArray.length === 0) {
          console.warn('Invalid message format:', messageArray);
          return;
        }
        for (let i = 0; i < messageArray.length; i++) {
          const deviceStatus = JSON.parse(messageArray[i]) as DeviceStatus;
          if (!deviceStatus?.device_id) {
            console.warn('Invalid device status:', deviceStatus);
            continue;
          }
          handleDeviceStatus(deviceStatus);
        }
      } catch (err) {

        console.error('Error processing WebSocket message:', err);
      }
    };
  }, [apiContext?.token, selectedDevice, fetchDevices, handleDeviceStatus]);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      // console.log('Disconnecting WebSocket...');
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    connectionAttemptsRef.current = 0;
  }, []);

  // Initialize WebSocket when authenticated
  useEffect(() => {
    if (apiContext?.isAuthenticated) {
      fetchDevices();
      connectWebSocket();
    }

    // Only disconnect when the component truly unmounts,
    // not when internal state or props change
    return () => {
      // Only disconnect when the provider itself is unmounting
      // Not when dependencies change during tab navigation
      if (!apiContext?.isAuthenticated) {
        disconnectWebSocket();
      }
    };
  }, [apiContext?.isAuthenticated]);  // Remove other dependencies

  // Reconnect when a device is selected
  useEffect(() => {
    if (selectedDevice) {
      // console.log('Device selected, ensuring connection...');
      connectWebSocket();
    }
  }, [selectedDevice, connectWebSocket]);

  const value = {
    devices,
    deviceStatuses,
    selectedDevice,
    setSelectedDevice,
    connectWebSocket,
    disconnectWebSocket,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = () => useContext(WebSocketContext);