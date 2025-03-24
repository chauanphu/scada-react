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
    <div className="h-[calc(100vh-6rem)] -mt-8 -mx-8 md:-mx-12 lg:-mx-24 xl:-mx-32 pt-6">
      {/* ===================== Desktop / Laptop Layout (3 columns) ===================== */}
      <div className="hidden md:grid grid-cols-6 gap-4 h-full">
        {/* Left Column: Device List (smaller; ~1/6 width) */}
        <div className="col-span-1 bg-white shadow-lg rounded-lg p-4 overflow-y-auto">
          <input
            type="text"
            placeholder="Tìm kiếm thiết bị..."
            className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <DeviceList
            devices={filteredDevices}
            onDeviceSelect={handleDeviceSelect}
            selectedDevice={selectedDevice}
          />
        </div>

        {/* Center Column: Device Map / Report View (wider; ~2/3 width) */}
        <div className="col-span-4 bg-gray-100 shadow-lg rounded-lg flex flex-col overflow-hidden">
          {selectedDevice && (
            <div className="p-4 bg-white flex gap-2">
              <Button
                variant={activeView === "control" ? "default" : "outline"}
                onClick={() => setActiveView("control")}
              >
                Bản đồ  
              </Button>
              <Button
                variant={activeView === "report" ? "default" : "outline"}
                onClick={() => setActiveView("report")}
                disabled={!selectedDevice}
              >
                Báo cáo
              </Button>
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            {activeView === "control" ? (
              <ErrorBoundary>
                <DeviceMap
                  devices={devices}
                  onDeviceSelect={handleDeviceSelect}
                  selectedDevice={selectedDevice}
                />
              </ErrorBoundary>
            ) : (
              selectedDevice && (
                <div className="h-full overflow-hidden">
                  <ReportView device={selectedDevice} />
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Column: Device Details (redesigned to fit narrow sidebar; ~1/6 width) */}
        <div className="col-span-1 bg-white shadow-lg rounded-lg p-4 overflow-y-auto">
        {selectedDevice ? (
            <DeviceDetails
              device={selectedDevice}
              deviceStatus={wsContext.deviceStatuses[selectedDevice._id]}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Chọn thiết bị để xem chi tiết
            </div>
          )}
        </div>
      </div>

      {/* ===================== Mobile Layout (Stacked / Single Column) ===================== */}
      <div className="md:hidden flex flex-col h-full">
        {/* Top Bar: Button to open the Device List modal */}
        <div className="p-4 bg-white shadow-lg">
          <button
            className="w-full p-2 bg-blue-500 text-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setShowDeviceList(true)}
          >
            Tìm kiếm thiết bị
          </button>
        </div>

        {/* Main Content: Toggle Buttons and Map / Report View */}
        <div className="flex-1 p-2">
          {selectedDevice && (
            <div className="mb-2 flex gap-2">
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
          )}
          <div className="h-64 overflow-hidden bg-gray-100 shadow-lg rounded-lg">
            {activeView === "control" ? (
              <ErrorBoundary>
                <DeviceMap
                  devices={devices}
                  onDeviceSelect={handleDeviceSelect}
                  selectedDevice={selectedDevice}
                />
              </ErrorBoundary>
            ) : (
              selectedDevice && (
                <div className="h-full overflow-hidden">
                  <ReportView device={selectedDevice} />
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom Section: Device Details */}
        <div className="p-4 bg-white shadow-lg">
          {selectedDevice ? (
            <DeviceDetails
              device={selectedDevice}
              deviceStatus={wsContext.deviceStatuses[selectedDevice._id]}
            />
          ) : (
            <div className="flex items-center justify-center text-gray-500">
              Chọn thiết bị để xem chi tiết
            </div>
          )}
        </div>
      </div>

      {/* ===================== Mobile Device List Modal ===================== */}
      {showDeviceList && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
          onClick={() => setShowDeviceList(false)}
        >
          <div
            className="bg-white p-4 rounded-lg shadow-lg w-11/12 max-h-[80vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
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
                className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
  );
};