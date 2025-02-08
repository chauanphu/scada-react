import { useState } from "react";
import { Device } from "../lib/api";
import { DeviceStatus } from "../types/Cluster";
import { useAPI } from "../contexts/APIProvider";
import { useWebSocket } from "../contexts/WebsocketProvider";
import { useToast } from "../contexts/ToastProvider";
import Switch from "react-switch";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface DeviceDetailsProps {
  device: Device;
  deviceStatus: DeviceStatus | undefined;
}

export const DeviceDetails = ({ device, deviceStatus }: DeviceDetailsProps) => {
  const apiContext = useAPI();
  const wsContext = useWebSocket();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [hourOn, setHourOn] = useState(deviceStatus?.hour_on || 0);
  const [minuteOn, setMinuteOn] = useState(deviceStatus?.minute_on || 0);
  const [hourOff, setHourOff] = useState(deviceStatus?.hour_off || 0);
  const [minuteOff, setMinuteOff] = useState(deviceStatus?.minute_off || 0);

  if (!apiContext || !wsContext) return null;

  const handleTogglePower = async () => {
    if (!deviceStatus) return;
    setLoading(true);
    try {
      // Toggle the device state by sending the opposite of the current state
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
      {/* Header: Device Name and Connection Status */}
      <div className="flex items-center gap-2">
        <div
          className={`h-3 w-3 rounded-full ${
            deviceStatus?.is_connected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm text-gray-600">
          {deviceStatus?.is_connected ? "Đã kết nối" : "Mất kết nối"}
        </span>
        <h3 className="text-lg font-semibold">
          {deviceStatus?.device_name || device.name}
        </h3>
      </div>

      {/* Control Panel: Stacked Layout */}
      <div className="space-y-4">
        {/* Toggle Power Switch */}
        <div className="flex items-center justify-between">
          <Switch
            checked={deviceStatus?.toggle || false}
            onChange={handleTogglePower}
            disabled={loading || !deviceStatus?.is_connected}
            onColor="#4ade80"  // green when "on"
            offColor="#f87171" // red when "off"
            uncheckedIcon={
              <div className="flex items-center justify-center h-full text-white text-xs px-1">
          Bật
              </div>
            }
            checkedIcon={
              <div className="flex items-center justify-center h-full text-white text-xs px-1">
          Tắt
              </div>
            }
            height={32}  // increased height
            width={64}   // increased width
          />
        </div>

        {/* Mode Selection */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-gray-700">Chế độ</h3>
          <Button
            variant={deviceStatus?.auto ? "outline" : "default"}
            onClick={handleToggleAuto}
            disabled={loading || !deviceStatus?.is_connected}
            className="w-full"
          >
            Thủ công
          </Button>
          <Button
            variant={deviceStatus?.auto ? "default" : "outline"}
            onClick={handleToggleAuto}
            disabled={loading || !deviceStatus?.is_connected}
            className="w-full"
          >
            Tự động
          </Button>
        </div>

        {/* Schedule Section */}
        <div className="space-y-2">
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

      {/* Real-Time Indicators (single column for a narrow sidebar) */}
      {deviceStatus && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Công suất</p>
            <p className="font-medium">{deviceStatus.power}W</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Dòng điện</p>
            <p className="font-medium">{deviceStatus.current}A</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Điện áp</p>
            <p className="font-medium">{deviceStatus.voltage}V</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Hệ số công suất</p>
            <p className="font-medium">{deviceStatus.power_factor}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Tổng năng lượng</p>
            <p className="font-medium">
              {deviceStatus.total_energy.toFixed(4)} kWh
            </p>
          </div>
        </div>
      )}
    </div>
  );
};