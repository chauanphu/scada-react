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
  connectionLost: boolean; // Added this property to the interface
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
  const maxReconnectAttempts = 3; // Changed from 5 to 3 as required
  const [connectionLost, setConnectionLost] = useState(false);

  const handleDeviceData = useCallback((data: any) => {
    if (!data?._id) return;

    const deviceId = data._id;
    const existingStatus = deviceStatuses[deviceId] || {};
    
    // Build the updated status, preserving metrics if not provided in this update
    const updatedStatus: DeviceStatus = {
      // Basic device info - always updated
      device_id: deviceId,
      device_name: data.name || existingStatus.device_name || "",
      mac: data.mac || existingStatus.mac || "",
      tenant_id: data.tenant_id || existingStatus.tenant_id || "",
      timestamp: data.timestamp || new Date().toISOString(),
      is_connected: data.is_connected !== undefined ? data.is_connected : true,
      
      // Control settings - always returned from server
      toggle: data.toggle !== undefined ? data.toggle : existingStatus.toggle || false,
      auto: data.auto !== undefined ? data.auto : existingStatus.auto || false,
      hour_on: data.hour_on !== undefined ? data.hour_on : existingStatus.hour_on || 0,
      hour_off: data.hour_off !== undefined ? data.hour_off : existingStatus.hour_off || 0,
      minute_on: data.minute_on !== undefined ? data.minute_on : existingStatus.minute_on || 0,
      minute_off: data.minute_off !== undefined ? data.minute_off : existingStatus.minute_off || 0,
      state: data.state !== undefined ? data.state : existingStatus.state,
      
      // Location - always returned from server
      latitude: data.latitude !== undefined ? data.latitude : existingStatus.latitude,
      longitude: data.longitude !== undefined ? data.longitude : existingStatus.longitude,
      
      // Metrics - only include if provided or preserved from existing data
      // If device is disconnected, metrics might be omitted
      power: data.power !== undefined ? data.power : existingStatus.power || 0,
      current: data.current !== undefined ? data.current : existingStatus.current || 0,
      voltage: data.voltage !== undefined ? data.voltage : existingStatus.voltage || 0,
      power_factor: data.power_factor !== undefined ? data.power_factor : existingStatus.power_factor || 0,
      total_energy: data.total_energy !== undefined ? data.total_energy : existingStatus.total_energy || 0,
      energy_meter: data.energy_meter !== undefined ? data.energy_meter : existingStatus.energy_meter,
    };

    // Update device status
    setDeviceStatus(prev => ({
      ...prev,
      [deviceId]: updatedStatus
    }));

    // Update device info in devices list if needed
    setDevices(prev => {
      const index = prev.findIndex(d => d._id === deviceId);
      if (index === -1) return prev;

      const updatedDevices = [...prev];
      const currentDevice = updatedDevices[index];

      // Only update device properties if there are actual changes
      if (
        (data.name && data.name !== currentDevice.name) ||
        (data.latitude !== undefined && data.latitude !== currentDevice.latitude) ||
        (data.longitude !== undefined && data.longitude !== currentDevice.longitude)
      ) {
        updatedDevices[index] = {
          ...currentDevice,
          name: data.name || currentDevice.name,
          latitude: data.latitude !== undefined ? data.latitude : currentDevice.latitude,
          longitude: data.longitude !== undefined ? data.longitude : currentDevice.longitude,
        };
        return updatedDevices;
      }

      return prev;
    });
  }, [deviceStatuses]);

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

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      connectionAttemptsRef.current = 0;
      if (connectionLost) {
        setConnectionLost(false);
        addToast('success', 'Kết nối đã được khôi phục');
      }
      if (isFirstConnectRef.current) {
        isFirstConnectRef.current = false;
        fetchDevices();
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event);
      wsRef.current = null;
      
      // Set connection lost state to true for UI feedback
      if (!connectionLost) {
        setConnectionLost(true);
        addToast('warning', 'Kết nối bị gián đoạn, đang thử kết nối lại...');
      }

      if (!reconnectTimeoutRef.current && connectionAttemptsRef.current < maxReconnectAttempts) {
        connectionAttemptsRef.current++;
        const delay = Math.min(1000 * Math.pow(2, connectionAttemptsRef.current), 10000); // Exponential backoff with max 10s

        console.log(`Attempting to reconnect (${connectionAttemptsRef.current}/${maxReconnectAttempts}) in ${delay}ms`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = undefined;
          connectWebSocket();
        }, delay);
      } else if (connectionAttemptsRef.current >= maxReconnectAttempts) {
        addToast('error', 'Không thể kết nối lại sau nhiều lần thử. Vui lòng làm mới trang.');
        setConnectionLost(true);
      }
    };

    ws.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
      // Don't set connection lost here as onclose will be called after onerror
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        // Parse the main message data
        let messageData;
        
        if (typeof event.data === 'string') {
          messageData = JSON.parse(event.data);
        } else {
          console.warn('Received non-string data from WebSocket');
          return;
        }
        
        // Process messages (both array and direct object formats)
        const processMessage = (message: any) => {
          if (typeof message === 'string') {
            try {
              message = JSON.parse(message);
            } catch (parseErr) {
              console.error('Error parsing message item:', parseErr);
              return;
            }
          }
          
          // All messages should have _id
          if (message?._id) {
            handleDeviceData(message);
          } else {
            console.warn('Invalid message format (missing _id):', message);
          }
        };
        
        if (Array.isArray(messageData)) {
          if (messageData.length > 0) {
            messageData.forEach(processMessage);
          }
        } else if (messageData && typeof messageData === 'object') {
          processMessage(messageData);
        } else {
          console.warn('Invalid message format:', messageData);
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
        console.error('Raw message data:', event.data);
      }
    };
  }, [apiContext?.token, selectedDevice, fetchDevices, handleDeviceData, connectionLost, addToast]);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    connectionAttemptsRef.current = 0;
    setConnectionLost(false);
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
    connectionLost, // Expose connection status to consuming components
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = () => useContext(WebSocketContext);