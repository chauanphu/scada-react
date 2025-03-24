import React from "react";
import { Device, DeviceStatus } from "../types/Cluster";
import { useWebSocket } from "../contexts/WebsocketProvider";
import { Button } from "./ui/button";

interface DeviceListProps {
  devices: Device[];
  selectedDevice: Device | null;
  onDeviceSelect: (device: Device | null) => void;
  onEditDevice?: (device: Device) => void;
  onDeleteDevice?: (deviceId: string) => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  selectedDevice,
  onDeviceSelect,
  onEditDevice,
  onDeleteDevice,
}) => {
  const wsContext = useWebSocket();
  const deviceStatuses = wsContext?.deviceStatuses || {};

  const handleDeviceClick = (device: Device, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button")) return; // Don't select if clicking buttons
    onDeviceSelect(device);
  };

  const getDeviceStatusText = (status: DeviceStatus) => {
    if (!status?.is_connected) return "Đang lấy dữ liệu";
    
    switch (status.state) {
      case "Mất kết nối":
        return "Mất kết nối";
      case "Thiết bị hoạt động":
        return "Thiết bị hoạt động";
      case "Thiết bị tắt":
        return "Thiết bị tắt";
      default:
        return status.state || "Không xác định";
    }
  };

  const getStatusColor = (status: DeviceStatus) => {
    if (!status?.is_connected) return "text-yellow-500";
    
    switch (status.state) {
      case "Mất kết nối":
        return "text-gray-500";
      case "Thiết bị hoạt động":
        return "text-green-500";
      case "Thiết bị tắt":
        return "text-red-500";
      default:
        return "text-gray-600";
    }
  };
  
  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="space-y-2 p-4">
        {devices.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Không tìm thấy thiết bị nào
          </div>
        ) : (
          devices
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((device) => {
            const status = deviceStatuses[device._id];

            return (
              <div
                key={device._id}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selectedDevice?._id === device._id
                    ? "bg-blue-50 border-blue-500 shadow-md"
                    : "bg-white hover:bg-gray-50 hover:shadow-md border-gray-200"
                } border`}
                onClick={(e) => handleDeviceClick(device, e)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-lg break-words">
                      {status?.device_name || device.name}
                    </h3>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={getStatusColor(status)}>
                      {getDeviceStatusText(status)}
                    </span>
                    {status?.is_connected && status.state !== "" && (
                      <span className="text-sm text-gray-600">
                        {status.power !== undefined ? `${status.power} W` : "N/A"}
                      </span>
                    )}
                  </div>
                  {(onEditDevice || onDeleteDevice) && (
                    <div className="flex justify-end space-x-2">
                      {onEditDevice && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditDevice(device);
                          }}
                        >
                          Chỉnh sửa
                        </Button>
                      )}
                      {onDeleteDevice && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDevice(device._id);
                          }}
                        >
                          Xóa
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};