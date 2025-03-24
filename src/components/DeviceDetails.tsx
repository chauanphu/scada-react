import { useState, useEffect } from "react";
import { Device } from "../lib/api";
import { DeviceStatus } from "../types/Cluster";
import { useAPI } from "../contexts/APIProvider";
import { useWebSocket } from "../contexts/WebsocketProvider";
import { useToast } from "../contexts/ToastProvider";
import Switch from "react-switch";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

interface DeviceDetailsProps {
  device: Device;
  deviceStatus: DeviceStatus | undefined;
}

export const DeviceDetails = ({ device, deviceStatus }: DeviceDetailsProps) => {
  const apiContext = useAPI();
  const wsContext = useWebSocket();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Create local state for optimistic UI updates
  const [localDeviceStatus, setLocalDeviceStatus] = useState<DeviceStatus | undefined>(deviceStatus);

  const [hourOn, setHourOn] = useState(deviceStatus?.hour_on || 0);
  const [minuteOn, setMinuteOn] = useState(deviceStatus?.minute_on || 0);
  const [hourOff, setHourOff] = useState(deviceStatus?.hour_off || 0);
  const [minuteOff, setMinuteOff] = useState(deviceStatus?.minute_off || 0);

  // Update state values when deviceStatus changes
  useEffect(() => {
    if (deviceStatus) {
      setLocalDeviceStatus(deviceStatus);
      setHourOn(deviceStatus.hour_on || 0);
      setMinuteOn(deviceStatus.minute_on || 0);
      setHourOff(deviceStatus.hour_off || 0);
      setMinuteOff(deviceStatus.minute_off || 0);
    }
  }, [deviceStatus]);

  if (!apiContext || !wsContext) return null;

  const isIdle = localDeviceStatus?.state === "";
  const isConnected = localDeviceStatus?.is_connected;

  const handleTogglePower = async () => {
    if (!localDeviceStatus || isIdle) return;
    setLoading(true);
    
    // Optimistically update UI
    const newToggleState = !localDeviceStatus.toggle;
    setLocalDeviceStatus({
      ...localDeviceStatus,
      toggle: newToggleState,
      state: newToggleState ? "ON" : "OFF"
    });
    
    try {
      await apiContext.toggleDevice(device._id, newToggleState);
      addToast("success", `Đã ${newToggleState ? "bật" : "tắt"} thiết bị`);
    } catch (err) {
      console.error("Lỗi khi thay đổi trạng thái:", err);
      addToast("error", "Không thể thay đổi trạng thái");
      
      // Revert on failure
      setLocalDeviceStatus({
        ...localDeviceStatus,
        toggle: !newToggleState,
        state: !newToggleState ? "ON" : "OFF"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAuto = async () => {
    if (!localDeviceStatus || isIdle) return;
    setLoading(true);
    
    // Optimistically update UI
    const newAutoState = !localDeviceStatus.auto;
    setLocalDeviceStatus({
      ...localDeviceStatus,
      auto: newAutoState
    });
    
    try {
      await apiContext.setDeviceAuto(device._id, newAutoState);
      addToast("success", `Đã ${newAutoState ? "bật" : "tắt"} chế độ tự động`);
    } catch (err) {
      console.error("Lỗi khi thay đổi chế độ tự động:", err);
      addToast("error", "Không thể thay đổi chế độ");
      
      // Revert on failure
      setLocalDeviceStatus({
        ...localDeviceStatus,
        auto: !newAutoState
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetSchedule = async () => {
    if (!localDeviceStatus || isIdle) return;
    setLoading(true);
    
    // Save original schedule for reverting if needed
    const originalSchedule = {
      hour_on: localDeviceStatus.hour_on,
      minute_on: localDeviceStatus.minute_on,
      hour_off: localDeviceStatus.hour_off,
      minute_off: localDeviceStatus.minute_off,
    };
    
    // Optimistically update UI
    const newSchedule = {
      hour_on: hourOn,
      minute_on: minuteOn,
      hour_off: hourOff,
      minute_off: minuteOff,
    };
    
    setLocalDeviceStatus({
      ...localDeviceStatus,
      ...newSchedule
    });
    
    try {
      await apiContext.setDeviceSchedule(device._id, newSchedule);
      addToast("success", "Lịch trình đã được cập nhật");
    } catch (err) {
      console.error("Lỗi khi đặt lịch trình:", err);
      addToast("error", "Không thể đặt lịch trình");
      
      // Revert UI on failure
      setLocalDeviceStatus({
        ...localDeviceStatus,
        ...originalSchedule
      });
      
      // Also revert input values
      setHourOn(originalSchedule.hour_on || 0);
      setMinuteOn(originalSchedule.minute_on || 0);
      setHourOff(originalSchedule.hour_off || 0);
      setMinuteOff(originalSchedule.minute_off || 0);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceStateColor = () => {
    if (!isConnected) return "bg-gray-500";
    if (isIdle) return "bg-yellow-500";
    if (localDeviceStatus?.state === "ON") return "bg-green-500";
    return "bg-red-500";
  };

  const getDeviceStateText = () => {
    if (!isConnected) return "Mất kết nối";
    if (isIdle) return "Đang đồng bộ";
    if (localDeviceStatus?.state === "ON") return "Đang bật";
    if (localDeviceStatus?.state === "OFF") return "Đang tắt";
    return localDeviceStatus?.state || "Không xác định";
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header: Device Name and Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${getDeviceStateColor()}`}
          />
          <span className="text-sm">
            {getDeviceStateText()}
          </span>
        </div>
        {isIdle && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
            Đang đồng bộ
          </Badge>
        )}
      </div>

      {/* Control Panel: Stacked Layout */}
      <div className="space-y-4">
        {/* Toggle Power Switch */}
        <div className="flex items-center justify-between">
          <Switch
            checked={localDeviceStatus?.toggle || false}
            onChange={handleTogglePower}
            disabled={loading || !isConnected || isIdle}
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
            variant={localDeviceStatus?.auto ? "outline" : "default"}
            onClick={handleToggleAuto}
            disabled={loading || !isConnected || isIdle}
            className="w-full"
          >
            Thủ công
          </Button>
          <Button
            variant={localDeviceStatus?.auto ? "default" : "outline"}
            onClick={handleToggleAuto}
            disabled={loading || !isConnected || isIdle}
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
              disabled={isIdle}
            />
            <Input
              type="number"
              placeholder="Phút bật"
              value={minuteOn}
              onChange={(e) => setMinuteOn(Number(e.target.value))}
              min={0}
              max={59}
              disabled={isIdle}
            />
            <Input
              type="number"
              placeholder="Giờ tắt"
              value={hourOff}
              onChange={(e) => setHourOff(Number(e.target.value))}
              min={0}
              max={23}
              disabled={isIdle}
            />
            <Input
              type="number"
              placeholder="Phút tắt"
              value={minuteOff}
              onChange={(e) => setMinuteOff(Number(e.target.value))}
              min={0}
              max={59}
              disabled={isIdle}
            />
          </div>
          <Button
            variant="default"
            onClick={handleSetSchedule}
            disabled={loading || !isConnected || isIdle}
            className="w-full"
          >
            Cài đặt lịch hoạt động
          </Button>
          {isIdle && (
            <p className="text-xs text-yellow-600 text-center mt-2">
              Thiết bị đang đồng bộ. Vui lòng đợi để điều khiển.
            </p>
          )}
        </div>
      </div>

      {/* Real-Time Indicators */}
      {localDeviceStatus && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Công suất</p>
            <p className="font-medium">{localDeviceStatus.power}W</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Dòng điện</p>
            <p className="font-medium">{localDeviceStatus.current}A</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Điện áp</p>
            <p className="font-medium">{localDeviceStatus.voltage}V</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Hệ số công suất</p>
            <p className="font-medium">{localDeviceStatus.power_factor}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Tổng năng lượng</p>
            <p className="font-medium">
              {localDeviceStatus.total_energy.toFixed(4)} kWh
            </p>
          </div>
        </div>
      )}
    </div>
  );
};