import React, { useState } from "react";
import { useWebSocket } from "../contexts/WebsocketProvider";
import { useAPI } from "../contexts/APIProvider";
import { Permissions } from "../lib/api";
import { Device, DeviceStatus } from "../types/Cluster";
import { DeviceList } from "../components/DeviceList";
import { DeviceMap } from "../components/DeviceMap";
import { DeviceDetails } from "../components/DeviceDetails";
import { useToast } from "../contexts/ToastProvider";
import { UserRole } from "../lib/api";
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full text-red-500">
          Error loading map. Please refresh the page.
        </div>
      );
    }
    return this.props.children;
  }
}

export const HomePage: React.FC = () => {
  const apiContext = useAPI();
  const wsContext = useWebSocket();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const { addToast } = useToast();
  if (apiContext.userRole !== UserRole.SUPERADMIN) {
  if (!wsContext || !apiContext || !apiContext.hasPermission(Permissions.VIEW_DEVICES)) {
    addToast("error", "Bạn không có quyền xem thiết bị");
    return null;
  }}

  const { devices, deviceStatuses } = wsContext;

  const filteredDevices = devices.filter((device) =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] -mt-8 -mx-4 pt-6">
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/4 h-[47%] overflow-y-hidden rounded-lg translate-y-7 bg-white shadow-lg">
          <div className="p-4 pt-8">
            <input
              type="text"
              placeholder="Tìm kiếm thiết bị..."
              className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <DeviceList
              devices={filteredDevices}
              deviceStatuses={deviceStatuses}
              onDeviceSelect={handleDeviceSelect}
              selectedDevice={selectedDevice}
            />
          </div>
        </div>
        <div className="flex-1 p-8 bg-gray-100 overflow-y-hidden">
          <div className="h-1/2 mb-4">
            <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden">
              <ErrorBoundary>
                <DeviceMap
                  devices={devices}
                  deviceStatuses={deviceStatuses}
                  onDeviceSelect={handleDeviceSelect}
                />
              </ErrorBoundary>
            </div>
          </div>
          <div className="h-1/2">
            <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden">
              {selectedDevice ? (
                <DeviceDetails
                  device={selectedDevice}
                  deviceStatus={deviceStatuses[selectedDevice._id]}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Chọn thiết bị để xem chi tiết
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
