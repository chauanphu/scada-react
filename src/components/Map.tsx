import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import iconOn from "../images/markers/on.png";
import iconOff from "../images/markers/off.png";
import iconDisable from "../images/markers/disable.png";
import { Unit, UnitStatus } from "../types/Cluster";
import { RightSidebar } from "./RightSidebar";
import { LatLngExpression } from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import { useWebSocket } from "../contexts/WebsocketProvider";

interface MapProps {
  selectedUnit: Unit | null;
  setSelectedUnit: (unit: Unit | null) => void;
}

export const Map = ({
  selectedUnit,
  setSelectedUnit,
}: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const socketContext = useWebSocket();
  const unitStatus = socketContext?.unitStatus || {};

  useEffect(() => {
    if (L && mapRef.current && selectedUnit) {
      if (selectedUnit.latitude && selectedUnit.longitude) {
        mapRef.current.setView(
          [selectedUnit.latitude, selectedUnit.longitude - 0.001], // Latitude first
          22
        );
      }
    }
  }, [selectedUnit, L]);

  if (!L) return null; // Wait until Leaflet is loaded

  const GetIcon = (
    iconSize: number,
    isConnected: boolean,
    isLightOn: boolean,
    unitName: string
  ) => {
    // Directly use the imported icon variables
    const iconUrl = isConnected ? (isLightOn ? iconOn : iconOff) : iconDisable;
  
    return L.divIcon({
      html: `
        <div style="display: flex; align-items: center; justify-content: center; text-align: center;">
          <img src="${iconUrl}" style="width: ${iconSize}px; height: ${iconSize}px;" />
          <span style="font-size: 12px; background: rgba(255, 255, 255, 0.8); padding: 2px 4px; border-radius: 4px; margin-left: 8px;">
            ${unitName}
          </span>
        </div>
      `,
      iconSize: [iconSize, iconSize],
      className: "custom-leaflet-icon",
    });
  };

  const getMarker = (unit: Unit, status: UnitStatus) => {
    const unitData = {
      id: unit.id,
      latitude: unit.latitude,
      longitude: unit.longitude,
      name: unit.name || "Unknown",
      mac: unit.mac || "Unknown",
    };

    const icon = GetIcon(25, status.is_connected, status.is_on, unitData.name);

    return (
      <Marker
        key={unit._id}
        position={[unitData.latitude, unitData.longitude] as LatLngExpression}
        icon={icon}
        eventHandlers={{
          click: () => setSelectedUnit(unitData),
        }}
      />
    );
  };

  return (
    <div className="flex">
      <MapContainer
        ref={mapRef}
        center={[10.8231, 106.6297] as LatLngExpression}
        zoom={22}
        className="h-screen w-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {selectedUnit &&
          unitStatus &&
          getMarker(selectedUnit, unitStatus[selectedUnit._id])}
      </MapContainer>
      <RightSidebar selectedUnit={selectedUnit} />
    </div>
  );
};
