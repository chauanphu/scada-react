import { useState } from "react";
import { Device } from "../lib/api";
import { DeviceStatus } from "../types/Cluster";
import { useAPI } from "../contexts/APIProvider";
import { useWebSocket } from "../contexts/WebsocketProvider";
import { useToast } from "../contexts/ToastProvider";
import { Button } from "./ui/button";

interface DeviceDetailsProps {
  device: Device;
  deviceStatus: DeviceStatus | undefined;
}

export const DeviceDetails = ({ device, deviceStatus }: DeviceDetailsProps) => {
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

  const handleSetSchedule = async () => {
    if (!deviceStatus) return;
    setLoading(true);
    try {
      // Placeholder for schedule logic
      const newSchedule = {
        hour_on: 8,
        hour_off: 18,
        minute_on: 0,
        minute_off: 0,
      };
      await apiContext.setDeviceSchedule(device._id, newSchedule);
    } catch (err) {
      console.error("Lỗi khi đặt lịch trình:", err);
      addToast("error", "Không thể đặt lịch trình");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Real-Time Status Indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`h-3 w-3 rounded-full ${
            deviceStatus?.is_connected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm text-gray-600">
          {deviceStatus?.is_connected ? "Đã kết nối" : "Mất kết nối"}
        </span>
      </div>

      {/* Device Name */}
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">{deviceStatus?.device_name || device.name}</h3>
      </div>

      {/* Toggle Power Button */}
      <div className="flex flex-col gap-2">
        <Button
          variant={deviceStatus?.toggle ? "destructive" : "default"}
          onClick={handleTogglePower}
          disabled={loading || !deviceStatus?.is_connected}
          className="w-full md:w-auto"
        >
          {deviceStatus?.toggle ? "Tắt" : "Bật"}
        </Button>
      </div>

      {/* Mode Selection */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-gray-700">Chế độ</h3>
        <div className="flex gap-2">
          <Button
            variant={deviceStatus?.auto ? "outline" : "default"}
            onClick={() => handleToggleAuto()}
            disabled={loading || !deviceStatus?.is_connected}
            className="w-full md:w-auto"
          >
            Thủ công
          </Button>
          <Button
            variant={deviceStatus?.auto ? "default" : "outline"}
            onClick={() => handleToggleAuto()}
            disabled={loading || !deviceStatus?.is_connected}
            className="w-full md:w-auto"
          >
            Tự động
          </Button>
        </div>
      </div>

      {/* Schedule Section */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-gray-700">Lịch trình</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSetSchedule}
            disabled={loading || !deviceStatus?.is_connected}
            className="w-full md:w-auto"
          >
            Đặt lịch
          </Button>
        </div>
        {deviceStatus && (
          <div className="space-y-1">
            <div className="text-sm text-gray-600">
              Bật lúc: {deviceStatus.hour_on}:{deviceStatus.minute_on}
            </div>
            <div className="text-sm text-gray-600">
              Tắt lúc: {deviceStatus.hour_off}:{deviceStatus.minute_off}
            </div>
          </div>
        )}
      </div>

      {/* Power Information */}
      {deviceStatus && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Công suất</p>
            <p className="font-medium">{deviceStatus.power}W</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Dòng điện</p>
            <p className="font-medium">{deviceStatus.current}A</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Điện áp</p>
            <p className="font-medium">{deviceStatus.voltage}V</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Hệ số công suất</p>
            <p className="font-medium">{deviceStatus.power_factor}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Tổng năng lượng</p>
            <p className="font-medium">{deviceStatus.total_energy}kWh</p>
          </div>
        </div>
      )}

      {/* Location Information */}
      {deviceStatus?.latitude && deviceStatus?.longitude && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-gray-700">Vị trí</h3>
          <div className="text-sm text-gray-600">
            Vĩ độ: {deviceStatus.latitude}, Kinh độ: {deviceStatus.longitude}
          </div>
        </div>
      )}
    </div>
  );
};