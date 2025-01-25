import React from "react";
import { Device, DeviceStatus } from "../types/Cluster";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

interface DeviceMapProps {
  devices: Device[];
  deviceStatuses: { [key: string]: DeviceStatus };
  onDeviceSelect: (device: Device) => void;
}

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export const DeviceMap: React.FC<DeviceMapProps> = ({
  devices,
  deviceStatuses,
  onDeviceSelect,
}) => {
  const center = { lat: 21.0285, lng: 105.8542 }; // Default center (Hanoi)

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {devices.map((device) => {
        const status = deviceStatuses[device._id];
        if (!device.latitude || !device.longitude) return null;

        return (
          <Marker
            key={device._id}
            position={[device.latitude, device.longitude]}
            eventHandlers={{
              click: () => onDeviceSelect(device),
            }}
          >
            <Popup>
              <div>
                <h3 className="font-medium">{device.name}</h3>
                <p className="text-sm text-gray-500">{device.mac}</p>
                {status && (
                  <div className="mt-2">
                    <p>Status: {status.is_connected ? "Connected" : "Disconnected"}</p>
                    <p>Power: {status.is_on ? "On" : "Off"}</p>
                    <p>Mode: {status.is_auto ? "Automatic" : "Manual"}</p>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}; 