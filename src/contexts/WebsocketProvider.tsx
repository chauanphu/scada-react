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

  const handleDeviceStatus = useCallback((deviceStatus: any) => {
    if (!deviceStatus?._id) return;

    // Map the new format to our DeviceStatus interface
    const deviceId = deviceStatus._id;
    
    // Get existing status values to preserve metrics if they aren't in the new message
    const existingStatus = deviceStatuses[deviceId] || {};
    
    // Create the updated device status with both new data and preserved existing metrics
    const updatedStatus: DeviceStatus = {
      // Preserve existing metrics if they exist
      power: existingStatus.power || 0,
      current: existingStatus.current || 0,
      voltage: existingStatus.voltage || 0,
      power_factor: existingStatus.power_factor || 0,
      total_energy: existingStatus.total_energy || 0,
      
      // Add new fields from the updated format
      device_id: deviceId,
      device_name: deviceStatus.name || existingStatus.device_name,
      is_connected: true,
      toggle: deviceStatus.toggle !== undefined ? deviceStatus.toggle : existingStatus.toggle || false,
      auto: deviceStatus.auto !== undefined ? deviceStatus.auto : existingStatus.auto || false,
      hour_on: deviceStatus.hour_on !== undefined ? deviceStatus.hour_on : existingStatus.hour_on || 0,
      hour_off: deviceStatus.hour_off !== undefined ? deviceStatus.hour_off : existingStatus.hour_off || 0,
      minute_on: deviceStatus.minute_on !== undefined ? deviceStatus.minute_on : existingStatus.minute_on || 0,
      minute_off: deviceStatus.minute_off !== undefined ? deviceStatus.minute_off : existingStatus.minute_off || 0,
      state: deviceStatus.state,
      
      // Preserve coordinates if available
      latitude: existingStatus.latitude,
      longitude: existingStatus.longitude,
      
      // Add required fields that were missing
      mac: deviceStatus.mac || existingStatus.mac || "",
      timestamp: deviceStatus.timestamp || existingStatus.timestamp || new Date().toISOString(),
      tenant_id: deviceStatus.tenant_id || existingStatus.tenant_id || "",
      
      // Preserve energy meter data if it exists
      energy_meter: existingStatus.energy_meter,
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

      // Update the device name if changed
      if (deviceStatus.name && deviceStatus.name !== currentDevice.name) {
        updatedDevices[index] = {
          ...currentDevice,
          name: deviceStatus.name,
        };
        return updatedDevices;
      }

      return prev;
    });
  }, [deviceStatuses]);

  const handleMetricsUpdate = useCallback((metrics: any) => {
    if (!metrics?.device_id) return;

    // Update only the metrics portions of the device status
    setDeviceStatus(prev => {
      const existingStatus = prev[metrics.device_id] || {
        device_id: metrics.device_id,
        is_connected: true,
        toggle: false,
        auto: false,
        hour_on: 0,
        hour_off: 0,
        minute_on: 0,
        minute_off: 0,
        power: 0,
        current: 0,
        voltage: 0,
        power_factor: 0,
        total_energy: 0,
        // Add required fields with default values
        mac: "",
        timestamp: new Date().toISOString(),
        tenant_id: "",
      };

      return {
        ...prev,
        [metrics.device_id]: {
          ...existingStatus,
          power: metrics.power !== undefined ? metrics.power : existingStatus.power,
          current: metrics.current !== undefined ? metrics.current : existingStatus.current,
          voltage: metrics.voltage !== undefined ? metrics.voltage : existingStatus.voltage,
          power_factor: metrics.power_factor !== undefined ? metrics.power_factor : existingStatus.power_factor,
          total_energy: metrics.total_energy !== undefined ? metrics.total_energy : existingStatus.total_energy,
          latitude: metrics.latitude !== undefined ? metrics.latitude : existingStatus.latitude,
          longitude: metrics.longitude !== undefined ? metrics.longitude : existingStatus.longitude,
          is_connected: true,
          // Update required fields if provided in the metrics
          mac: metrics.mac || existingStatus.mac,
          timestamp: metrics.timestamp || new Date().toISOString(),
          tenant_id: metrics.tenant_id || existingStatus.tenant_id,
          // Add energy_meter if it exists
          energy_meter: metrics.energy_meter !== undefined ? metrics.energy_meter : existingStatus.energy_meter,
        }
      };
    });

    // Update coordinates in device list if provided
    if (metrics.latitude !== undefined && metrics.longitude !== undefined) {
      setDevices(prev => {
        const index = prev.findIndex(d => d._id === metrics.device_id);
        if (index === -1) return prev;

        const updatedDevices = [...prev];
        const currentDevice = updatedDevices[index];

        if (
          metrics.latitude !== currentDevice.latitude ||
          metrics.longitude !== currentDevice.longitude
        ) {
          updatedDevices[index] = {
            ...currentDevice,
            latitude: metrics.latitude,
            longitude: metrics.longitude,
          };
          return updatedDevices;
        }
        return prev;
      });
    }
  }, []);

  const handleCombinedData = useCallback((data: any) => {
    if (!data?._id || !data?.device_id) return;

    // This is a combined format with both device info and metrics
    const deviceId = data._id;

    const updatedStatus: DeviceStatus = {
      // Basic device info
      device_id: deviceId,
      device_name: data.name || data.device_name,
      mac: data.mac || "",
      tenant_id: data.tenant_id || "",
      timestamp: data.timestamp || new Date().toISOString(),
      
      // Control settings
      toggle: data.toggle !== undefined ? data.toggle : false,
      auto: data.auto !== undefined ? data.auto : false,
      hour_on: data.hour_on !== undefined ? data.hour_on : 0,
      hour_off: data.hour_off !== undefined ? data.hour_off : 0,
      minute_on: data.minute_on !== undefined ? data.minute_on : 0,
      minute_off: data.minute_off !== undefined ? data.minute_off : 0,
      state: data.state,
      
      // Metrics
      voltage: data.voltage || 0,
      current: data.current || 0,
      power: data.power || 0,
      power_factor: data.power_factor || 0,
      total_energy: data.total_energy || 0,
      energy_meter: data.energy_meter,
      
      // Location
      latitude: data.latitude,
      longitude: data.longitude,
      
      // Status
      is_connected: true,
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

      // Check if we need to update device properties
      if (
        data.name !== currentDevice.name ||
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

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      connectionAttemptsRef.current = 0;
      if (isFirstConnectRef.current) {
        isFirstConnectRef.current = false;
        fetchDevices();
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event);
      wsRef.current = null;

      if (!reconnectTimeoutRef.current && selectedDevice && connectionAttemptsRef.current < maxReconnectAttempts) {
        connectionAttemptsRef.current++;
        const delay = Math.min(1000 * Math.pow(2, connectionAttemptsRef.current), 30000);

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
      try {
        // Parse the main message data
        let messageData;
        
        if (typeof event.data === 'string') {
          messageData = JSON.parse(event.data);
        } else {
          console.warn('Received non-string data from WebSocket');
          return;
        }
        
        // Handle both array and direct object formats
        if (Array.isArray(messageData)) {
          if (messageData.length === 0) {
            return;
          }
          
          // Process each item in the array
          for (let i = 0; i < messageData.length; i++) {
            let message = messageData[i];
            
            // Check if the item needs to be parsed from string
            if (typeof message === 'string') {
              try {
                message = JSON.parse(message);
              } catch (parseErr) {
                console.error('Error parsing message item:', parseErr);
                continue;
              }
            }
            
            // Process based on message format
            if (message._id && message.device_id) {
              // This is the combined device data format
              handleCombinedData(message);
            } else if (message._id) {
              // This is a device state update with the old format
              handleDeviceStatus(message);
            } else if (message.device_id) {
              // This is a metrics update with the old format
              handleMetricsUpdate(message);
            } else {
              console.warn('Unknown message format:', message);
            }
          }
        } else if (messageData && typeof messageData === 'object') {
          // Handle direct object message
          if (messageData._id && messageData.device_id) {
            // This is the combined device data format
            handleCombinedData(messageData);
          } else if (messageData._id) {
            handleDeviceStatus(messageData);
          } else if (messageData.device_id) {
            handleMetricsUpdate(messageData);
          } else {
            console.warn('Unknown message format:', messageData);
          }
        } else {
          console.warn('Invalid message format:', messageData);
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
        console.error('Raw message data:', event.data);
      }
    };
  }, [apiContext?.token, selectedDevice, fetchDevices, handleDeviceStatus, handleMetricsUpdate, handleCombinedData]);

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