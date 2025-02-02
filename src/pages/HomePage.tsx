import React, { useState } from "react";
import { useWebSocket } from "../contexts/WebsocketProvider";
import { Device } from "../types/Cluster";
import { DeviceList } from "../components/DeviceList";
import { DeviceMap } from "../components/DeviceMap";
import { DeviceDetails } from "../components/DeviceDetails";
import { Button } from "../components/ui/button";
import { ReportView } from "../components/ReportView";

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
          Lỗi khi tải bản đồ. Vui lòng tải lại trang.
        </div>
      );
    }
    return this.props.children;
  }
}

export const HomePage = () => {
  const wsContext = useWebSocket();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [activeView, setActiveView] = useState<"control" | "report">("control");

  if (!wsContext) return null;

  const { devices } = wsContext;

  const filteredDevices = devices.filter(
    (device) =>
      device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false
  );

  const handleDeviceSelect = (device: Device | null) => {
    setSelectedDevice(device);
    setActiveView("control");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] -mt-8 -mx-4 pt-6">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (unchanged) */}
        <div className="w-1/5 overflow-y-hidden rounded-lg hidden md:block">
          <div className="p-4 pt-8 bg-white shadow-lg rounded-lg">
            <input
              type="text"
              placeholder="Tìm kiếm thiết bị..."
              className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="overflow-y-scroll h-[68vh] max-h-[68vh]">
              <DeviceList
                devices={filteredDevices}
                onDeviceSelect={handleDeviceSelect}
                selectedDevice={selectedDevice}
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-2 bg-gray-100 overflow-hidden">
          {/* Toggle Buttons */}
          {selectedDevice && (
            <div className="flex justify-between p-4 bg-white rounded-t-lg shadow-lg">
              <div className="flex gap-2">
                <Button
                  variant={activeView === "control" ? "default" : "outline"}
                  onClick={() => setActiveView("control")}
                >
                  Bảng điều khiển
                </Button>
                <Button
                  variant={activeView === "report" ? "default" : "outline"}
                  onClick={() => setActiveView("report")}
                  disabled={!selectedDevice}
                >
                  Báo cáo tiêu thụ
                </Button>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="h-[calc(100%-4rem)] bg-white rounded-b-lg shadow-lg overflow-hidden">
            {activeView === "control" ? (
              <>
                {/* Device Map (Top Half) */}
                <div className="h-1/2 border-b">
                  <ErrorBoundary>
                    <DeviceMap
                      devices={devices}
                      onDeviceSelect={handleDeviceSelect}
                      selectedDevice={selectedDevice}
                    />
                  </ErrorBoundary>
                </div>

                {/* Device Details (Bottom Half) */}
                <div className="h-1/2 overflow-y-auto">
                  {selectedDevice ? (
                    <DeviceDetails
                      device={selectedDevice}
                      deviceStatus={
                        wsContext.deviceStatuses[selectedDevice._id]
                      }
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Chọn thiết bị để xem chi tiết
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Full-Screen Report View */
              selectedDevice && (
                <div className="h-full overflow-hidden">
                  <ReportView device={selectedDevice} />
                </div>
              )
            )}
          </div>
        </div>

        {/* Mobile Device List Button */}
        <div className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <button
            className="p-2 bg-blue-500 text-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setShowDeviceList(true)}
          >
            Tìm kiếm thiết bị
          </button>
        </div>

        {/* Mobile Device List Modal */}
        {showDeviceList && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
            onClick={() => setShowDeviceList(false)}
          >
            <div
              className="bg-white p-4 rounded-lg shadow-lg w-11/12 max-h-[80vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()} // Prevent click propagation to backdrop
            >
              <div className="sticky top-0 bg-white pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Chọn thiết bị</h2>
                  <button
                    className="p-2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowDeviceList(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm thiết bị..."
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <DeviceList
                devices={filteredDevices}
                onDeviceSelect={(device) => {
                  handleDeviceSelect(device);
                  setShowDeviceList(false);
                }}
                selectedDevice={selectedDevice}
              />

              {/* Bottom close button for mobile */}
              <div className="sticky bottom-0 bg-white pt-4 border-t">
                <button
                  className="w-full p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  onClick={() => setShowDeviceList(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
