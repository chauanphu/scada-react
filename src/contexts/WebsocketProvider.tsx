// app/contexts/WebsocketProvider.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { useAPI } from "./APIProvider";
import { NEXT_PUBLIC_WS_URL } from "../lib/api";
import { UnitStatus } from "../types/Cluster";

interface WebSocketContextType {
  unitStatus: Record<number, UnitStatus>;
  selectedUnit: UnitStatus | null;
  setSelectedUnit: React.Dispatch<React.SetStateAction<UnitStatus | null>>;
  toggleLight: (unitId: number) => void;
  sendMessage: (unitId: number, message: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

type AliveResponse = {
  alive: "0" | "1";
  time: string;
};

type StatusResponse = {
  time: string;
  power: number;
  power_factor: number;
  current: number;
  voltage: number;
  frequency: number;
  gps_log: number;
  gps_lat: number;
  total_energy: number;
  toggle: number;
};

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const apiContext = useAPI();
  const token = apiContext?.token;
  const isAuthenticated = apiContext?.isAuthenticated;
  const clusters = useMemo(() => {
    return apiContext?.clusters || [];
  }, [apiContext?.clusters]);
  const [sockets, setSockets] = useState<Map<number, WebSocket>>(new Map());
  const [unitStatus, setUnitStatus] = useState<Record<number, UnitStatus>>({});
  const [selectedUnit, setSelectedUnit] = useState<UnitStatus | null>(null);

  useEffect(() => {
    const connectWebSocket = (unitId: number) => {
      const ws = new WebSocket(`${NEXT_PUBLIC_WS_URL}/unit/${unitId}/status`);

      ws.onmessage = (event) => {
        const data: AliveResponse | StatusResponse = JSON.parse(event.data);
        // Handle alive message
        if ("alive" in data && data.alive === "0") {
          setUnitStatus((prevState) => ({
            ...prevState,
            [unitId]: { ...prevState[unitId], isConnected: false },
          }));
        } else if ("power" in data) {
          setUnitStatus((prevState) => ({
            ...prevState,
            [unitId]: {
              ...prevState[unitId],
              isConnected: true,
              isOn: data.toggle === 1,
              power: data.power,
              current: data.current,
              voltage: data.voltage,
              gps_lat: data.gps_lat,
              gps_log: data.gps_log,
            },
          }));
        }
      };
      return ws;
    };

    if (isAuthenticated && token && clusters.length > 0) {
      //
      const newSockets = new Map<number, WebSocket>();
      clusters.forEach((cluster: { units: { id: number }[] }) => {
        cluster.units.forEach((unit) => {
          const ws = connectWebSocket(unit.id);
          newSockets.set(unit.id, ws);
        });
      });
      setSockets(newSockets);

      return () => {
        newSockets.forEach((ws) => ws.close());
      };
    }
  }, [isAuthenticated, token, clusters]);

  const sendMessage = (unitId: number, message: string) => {
    const ws = sockets.get(unitId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ message }));
    } else {
      console.warn(`WebSocket for unit ${unitId} is not open.`);
    }
  };

  const toggleLight = (unitId: number) => {
    const status = unitStatus[unitId];
    if (status) {
      setUnitStatus((prevState) => ({
        ...prevState,
        [unitId]: { ...status, isOn: !status.isOn },
      }));
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        unitStatus,
        selectedUnit,
        setSelectedUnit,
        toggleLight,
        sendMessage,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
