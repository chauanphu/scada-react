import { useEffect } from "react";
import { Device } from "../types/Cluster";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L, { LatLngExpression, LatLngBoundsLiteral } from "leaflet";
import "leaflet/dist/leaflet.css";
import iconOn from "../images/markers/on.png";
import iconOff from "../images/markers/off.png";
import iconDisable from "../images/markers/disable.png";
import { useWebSocket } from "../contexts/WebsocketProvider";

interface DeviceMapProps {
  devices: Device[];
  selectedDevice: Device | null;
  onDeviceSelect: (device: Device | null) => void;
}

const MapController = ({
  devices,
  selectedDevice
}: {
  devices: Device[];
  selectedDevice: Device | null;
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectedDevice?.latitude && selectedDevice?.longitude) {
      // console.log('Đang phóng to đến thiết bị được chọn:', selectedDevice);
      map.setView(
        [selectedDevice.latitude, selectedDevice.longitude],
        18,
        { animate: true, duration: 1 }
      );
    } else {
      const validDevices = devices.filter(d => d.latitude && d.longitude);
      if (validDevices.length > 0) {
        // console.log('Đang điều chỉnh bản đồ cho tất cả thiết bị:', validDevices);
        const lats = validDevices.map(d => d.latitude!);
        const lngs = validDevices.map(d => d.longitude!);
        const bounds: LatLngBoundsLiteral = [
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)]
        ];
        map.fitBounds(bounds, { 
          padding: [50, 50],
          animate: true,
          duration: 1,
          maxZoom: 16
        });
      } else {
        // Chế độ xem mặc định cho Việt Nam
        map.setView([21.0285, 105.8542], 13);
      }
    }
  }, [map, selectedDevice, devices]);

  return null;
};

interface DeviceStatus {
  is_connected: boolean;
  toggle: boolean;
  auto: boolean;
  power: number;
}

export const DeviceMap = ({
  devices,
  selectedDevice,
  onDeviceSelect,
}: DeviceMapProps) => {
  const wsContext = useWebSocket();
  const deviceStatuses: Record<string, DeviceStatus> = wsContext?.deviceStatuses || {};

  // console.log('Hiển thị bản đồ thiết bị:', {
  //   devices,
  //   selectedDevice,
  //   deviceStatuses
  // });

  const createIcon = (status: boolean, power: boolean, name: string) => {
    const iconUrl = status ? (power ? iconOn : iconOff) : iconDisable;
    
    return L.divIcon({
      html: `
        <div style="display:flex;align-items:center;justify-content:center;text-align:center;transform:translateY(-50%)">
          <div style="position:relative">
            <img src="${iconUrl}" style="width:30px;height:30px;"/>
            <span style="position:absolute;top:-25px;left:50%;transform:translateX(-50%);white-space:nowrap;
                        font-size:12px;background:rgba(255,255,255,0.9);padding:2px 8px;border-radius:4px;
                        box-shadow:0 1px 2px rgba(0,0,0,0.1)">
              ${name}
            </span>
          </div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      className: "custom-device-marker",
    });
  };

  const getDefaultCenter = (): LatLngExpression => {
    if (selectedDevice?.latitude && selectedDevice?.longitude) {
      return [selectedDevice.latitude, selectedDevice.longitude];
    }

    const validDevices = devices.filter(d => d.latitude && d.longitude);
    if (validDevices.length === 0) return [21.0285, 105.8542];

    const lats = validDevices.map(d => d.latitude!);
    const lngs = validDevices.map(d => d.longitude!);
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2
    ];
  };

  const validDevices = devices.filter(d => d.latitude && d.longitude);
  // console.log('Thiết bị có tọa độ hợp lệ:', validDevices);

  return (
    <div className="flex h-full">
      <div className="w-full h-full relative">
        <MapContainer
          center={getDefaultCenter()}
          zoom={13}
          className="w-full h-full"
          minZoom={4}
          maxZoom={19}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController devices={devices} selectedDevice={selectedDevice} />
          {validDevices.map((device) => {
            const status = deviceStatuses[device._id];
            // console.log(`Tạo điểm đánh dấu cho thiết bị ${device._id}:`, {
            //   device,
            //   status
            // });

            const icon = createIcon(
              status?.is_connected || false,
              status?.toggle || false,
              device.name || "Không xác định"
            );

            return (
              <Marker
                key={device._id}
                position={[device.latitude!, device.longitude!]}
                icon={icon}
                eventHandlers={{
                  click: () => onDeviceSelect(device),
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-medium">{device.name}</h3>
                    <p className="text-sm text-gray-500">{device.mac}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {device.latitude?.toFixed(6)}, {device.longitude?.toFixed(6)}
                    </p>
                    {status && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm flex items-center gap-2">
                          Trạng thái: 
                          <span className={status.is_connected ? "text-green-600" : "text-red-600"}>
                            {status.is_connected ? "Đã kết nối" : "Mất kết nối"}
                          </span>
                        </p>
                        <p className="text-sm">
                          Nguồn điện: {status.toggle ? "Bật" : "Tắt"}
                        </p>
                        <p className="text-sm">
                          Chế độ: {status.auto ? "Tự động" : "Thủ công"}
                        </p>
                        {status.power > 0 && (
                          <p className="text-sm">
                            Công suất: {status.power}W
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
        <div className="absolute top-2 right-2 z-[1000] bg-white rounded-lg shadow-lg">
          <button
            className="px-4 py-2 text-sm hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => onDeviceSelect(null)}
          >
            Đặt lại góc nhìn
          </button>
        </div>
      </div>
    </div>
  );
};