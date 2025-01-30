import React from "react";
import { Device } from "../types/Cluster";
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

  console.log("DeviceList render:", {
    devices,
    selectedDevice,
    deviceStatuses,
  });

  const handleDeviceClick = (device: Device, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button")) return; // Don't select if clicking buttons
    onDeviceSelect(device);
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="space-y-2 p-4">
        {devices.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Không tìm thấy thiết bị nào
          </div>
        ) : (
          devices.map((device) => {
            const status = deviceStatuses[device._id];
            console.log(`Device ${device._id} status:`, status);

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
                    {status && status.is_connected ? (
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <div className="grid grid-cols-2 gap-1">
                          <div className="bg-gray-50 p-1 rounded">
                            <span className="text-xs text-gray-500">
                              Trạng Thái
                            </span>
                            <p className="font-medium">
                              {status.toggle ? "Bật" : "Tắt"}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-1 rounded">
                            <span className="text-xs text-gray-500">
                              Chế độ
                            </span>
                            <p className="font-medium">
                              {status.auto ? "Tự Động" : "Thủ Công"}
                            </p>
                          </div>
                        </div>
                        {status.power > 0 && (
                          <div className="bg-gray-50 p-1 rounded">
                            <span className="text-xs text-gray-500">
                              Công suất
                            </span>
                            <p className="font-medium">{status.power}W</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Đang tải dữ liệu...
                      </div>
                    )}
                  </div>
                  {status && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {status.is_connected ? "Đã kết nối" : "Mất kết nối"}
                      </span>
                      <div
                        className={`h-3 w-3 rounded-full flex-shrink-0 ${
                          status.is_connected ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                    </div>
                  )}
                </div>
                {(onEditDevice || onDeleteDevice) && (
                  <div className="mt-4 flex justify-end space-x-2">
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
            );
          })
        )}
      </div>
    </div>
  );
};
