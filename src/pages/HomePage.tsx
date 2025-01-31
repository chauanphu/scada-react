import React, { useState, useEffect } from "react";
import { useWebSocket } from "../contexts/WebsocketProvider";
import { useAPI } from "../contexts/APIProvider";
import { Device } from "../types/Cluster";
import { DeviceList } from "../components/DeviceList";
import { DeviceMap } from "../components/DeviceMap";
import { DeviceDetails } from "../components/DeviceDetails";
import { useToast } from "../contexts/ToastProvider";
import { PUBLIC_API_URL } from "../lib/api";
import { Button } from "../components/ui/button";
import { ReportView } from "../components/ReportView";

interface ReportData {
  timestamp: string;
  power: number;
  energy: number;
}

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
  const apiContext = useAPI();
  const wsContext = useWebSocket();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const { addToast } = useToast();
  const [, setReportData] = useState<ReportData[] | null>(null);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [activeView, setActiveView] = useState<"control" | "report">("control");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchReportData = async () => {
    if (!selectedDevice || !apiContext?.token) return;

    try {
      const now = new Date();
      const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const response = await fetch(
        `${PUBLIC_API_URL}/report/?device_id=${
          selectedDevice._id
        }&start_date=${startDate.toISOString()}&end_date=${now.toISOString()}&aggregation=hourly`,
        {
          headers: {
            Authorization: `Bearer ${apiContext.token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Không thể tải báo cáo");

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error("Lỗi khi tải báo cáo:", err);
      addToast("error", "Không thể tải báo cáo thiết bị");
    }
  };

  useEffect(() => {
    if (selectedDevice) {
      void fetchReportData();
    }
  }, [selectedDevice]);

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
        <div className="flex-1 p-2 bg-gray-100 overflow-y-hidden">
          {/* Toggle Buttons */}
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
                <div className="h-1/2 overflow-y-scroll">
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
              </>
            ) : (
              /* Full-Screen Report View */
              selectedDevice && <ReportView device={selectedDevice} />
            )}
          </div>
        </div>

        {/* Mobile Device List (unchanged) */}
        <div className="md:hidden absolute place-content-center pt-5 justify-self-center">
          <div className="flex justify-center">
            <button
              className="w-full p-2 bg-blue-500 text-white rounded self-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setShowDeviceList(true)}
            >
              Tìm kiếm thiết bị
            </button>
          </div>
          {showDeviceList && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center pt-[100%] z-50">
              <div className="bg-white p-4 rounded-lg shadow-lg w-11/12 max-h-[80vh] overflow-y-scroll">
                <button
                  className="top-2 right-2 text-4xl text-gray-500"
                  onClick={() => setShowDeviceList(false)}
                >
                  &times;
                </button>
                <input
                  type="text"
                  placeholder="Tìm kiếm thiết bị..."
                  className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <DeviceList
                  devices={filteredDevices}
                  onDeviceSelect={(device) => {
                    handleDeviceSelect(device);
                    setShowDeviceList(false);
                  }}
                  selectedDevice={selectedDevice}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};