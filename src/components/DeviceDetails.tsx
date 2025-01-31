import { useState } from "react";
import { Device } from "../lib/api";
import { DeviceStatus } from "../types/Cluster";
import { useAPI } from "../contexts/APIProvider";
import { useWebSocket } from "../contexts/WebsocketProvider";
import { useToast } from "../contexts/ToastProvider";

interface DeviceDetailsProps {
  device: Device;
  deviceStatus: DeviceStatus | undefined;
}

export const DeviceDetails = ({
  device,
  deviceStatus,
}: DeviceDetailsProps) => {
  const apiContext = useAPI();
  const wsContext = useWebSocket();
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  if (!apiContext || !wsContext) return null;

  const handleTogglePower = async () => {
    if (!deviceStatus) return;
    setLoading(true);
    try {
      await apiContext.toggleDevice(device._id, !deviceStatus.toggle);
    } catch (err) {
       
      console.error("Lỗi khi thay đổi trạng thái:", err);
      addToast("error", "Không thể thay đổi trạng thái");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAuto = async () => {
    if (!deviceStatus) return;
    setLoading(true);
    try {
      await apiContext.setDeviceAuto(device._id, !deviceStatus.auto);
    } catch (err) {
       
      console.error("Lỗi khi thay đổi chế độ tự động:", err);
      addToast("error", "Không thể thay đổi chế độ");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-1 sm:p-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-3">
        {deviceStatus && (
          <div className="bg-gray-50 p-1 rounded-lg">
            <h3 className="text-lg font-semibold mb-0">Bảng điều khiển</h3>
            <div className="space-y-4">
              <div>
                <p className="mb-2">
                  <span className="font-medium">Hoạt động :</span>{" "}
                  <span
                    className={
                      deviceStatus.toggle
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {deviceStatus.toggle ? "Đang bật" : "Đang tắt"}
                  </span>
                </p>
                <button
                  onClick={handleTogglePower}
                  disabled={loading || !deviceStatus.is_connected}
                  className={`relative flex items-center w-12 h-6 rounded-full transition-all transform active:scale-[0.98] ${
                    deviceStatus.toggle
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span
                    className={`absolute w-4 h-4 rounded-full bg-white transition-all transform ${
                      deviceStatus.toggle ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div>
                <p className="mb-2">
                  <span className="font-medium">Chế độ:</span>{" "}
                  {deviceStatus.auto ? "Tự động" : "Thủ công"}
                </p>
                <button
                  onClick={handleToggleAuto}
                  disabled={loading || !deviceStatus.is_connected}
                  className={`w-full py-2 px-4 rounded-md font-medium ${
                    deviceStatus.auto
                      ? "bg-yellow-600 text-white hover:bg-yellow-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {deviceStatus.auto
                    ? "Chuyển sang thủ công"
                    : "Chuyển sang tự động"}
                </button>
              </div>

              {deviceStatus.power > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Thông tin điện</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 text-sm">
                    <div className="bg-white p-2 rounded">
                      <p className="text-gray-600">Công suất</p>
                      <p className="font-medium">{deviceStatus.power}W</p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-gray-600">Dòng điện</p>
                      <p className="font-medium">{deviceStatus.current}A</p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-gray-600">Điện áp</p>
                      <p className="font-medium">{deviceStatus.voltage}V</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
