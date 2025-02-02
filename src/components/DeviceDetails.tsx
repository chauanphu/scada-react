import { useState } from "react";
import { Device } from "../lib/api";
import { DeviceStatus } from "../types/Cluster";
import { useAPI } from "../contexts/APIProvider";
import { useWebSocket } from "../contexts/WebsocketProvider";
import { useToast } from "../contexts/ToastProvider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface DeviceDetailsProps {
  device: Device;
  deviceStatus: DeviceStatus | undefined;
}

export const DeviceDetails = ({ device, deviceStatus }: DeviceDetailsProps) => {
  const apiContext = useAPI();
  const wsContext = useWebSocket();
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const [hourOn, setHourOn] = useState(deviceStatus?.hour_on || 0);
  const [minuteOn, setMinuteOn] = useState(deviceStatus?.minute_on || 0);
  const [hourOff, setHourOff] = useState(deviceStatus?.hour_off || 0);
  const [minuteOff, setMinuteOff] = useState(deviceStatus?.minute_off || 0);

  if (!apiContext || !wsContext) return null;

  const handleTogglePower = async () => {
    if (!deviceStatus) return;
    setLoading(true);
    try {
      await apiContext.toggleDevice(device._id, !deviceStatus.toggle);
      addToast("success", `Đã ${deviceStatus.toggle ? "tắt" : "bật"} thiết bị`);
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
      addToast("success", `Đã ${deviceStatus.auto ? "tắt" : "bật"} chế độ tự động`);
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
      const newSchedule = {
        hour_on: hourOn,
        minute_on: minuteOn,
        hour_off: hourOff,
        minute_off: minuteOff,
      };
      await apiContext.setDeviceSchedule(device._id, newSchedule);
      addToast("success", "Lịch trình đã được cập nhật");
    } catch (err) {
      console.error("Lỗi khi đặt lịch trình:", err);
      addToast("error", "Không thể đặt lịch trình");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Device Name and Status */}
      <div className="flex items-center gap-2">
        <div
          className={`h-3 w-3 rounded-full ${
            deviceStatus?.is_connected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm text-gray-600">
          {deviceStatus?.is_connected ? "Đã kết nối" : "Mất kết nối"}
        </span>
        <h3 className="text-lg font-semibold">{deviceStatus?.device_name || device.name}</h3>
      </div>

      {/* Main Layout: Control Panel and Real-Time Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Half: Control Panel */}
        <div className="space-y-4">
          {/* Toggle Power Button */}
          <div className="flex flex-col gap-2">
            <Button
              variant={deviceStatus?.toggle ? "destructive" : "default"}
              onClick={handleTogglePower}
              disabled={loading || !deviceStatus?.is_connected}
              className="w-full"
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
                className="w-full"
              >
                Thủ công
              </Button>
              <Button
                variant={deviceStatus?.auto ? "default" : "outline"}
                onClick={() => handleToggleAuto()}
                disabled={loading || !deviceStatus?.is_connected}
                className="w-full"
              >
                Tự động
              </Button>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-gray-700">Lịch trình</h3>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Giờ bật"
                value={hourOn}
                onChange={(e) => setHourOn(Number(e.target.value))}
                min={0}
                max={23}
              />
              <Input
                type="number"
                placeholder="Phút bật"
                value={minuteOn}
                onChange={(e) => setMinuteOn(Number(e.target.value))}
                min={0}
                max={59}
              />
              <Input
                type="number"
                placeholder="Giờ tắt"
                value={hourOff}
                onChange={(e) => setHourOff(Number(e.target.value))}
                min={0}
                max={23}
              />
              <Input
                type="number"
                placeholder="Phút tắt"
                value={minuteOff}
                onChange={(e) => setMinuteOff(Number(e.target.value))}
                min={0}
                max={59}
              />
            </div>
            <Button
              variant="default"
              onClick={handleSetSchedule}
              disabled={loading || !deviceStatus?.is_connected}
              className="w-full"
            >
              Cài đặt lịch hoạt động
            </Button>
          </div>
        </div>

        {/* Right Half: Real-Time Indicators */}
        <div className="space-y-4">
          {/* Power Information */}
          {deviceStatus && (
            <div className="grid grid-cols-2 gap-4">
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
                <p className="font-medium">{deviceStatus.total_energy.toFixed(4)}kWh</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};