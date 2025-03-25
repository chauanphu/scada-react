import { useState, useEffect, useRef } from "react";
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
  const [editingSchedule, setEditingSchedule] = useState(false);

  // Create local state for optimistic UI updates
  const [localDeviceStatus, setLocalDeviceStatus] = useState<DeviceStatus | undefined>(deviceStatus);
  
  // Add state for tracking expected values and verification
  const [expectedValues, setExpectedValues] = useState<Partial<DeviceStatus>>({});
  const [mismatchCount, setMismatchCount] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(false);
  
  // Add a timestamp reference to track when verification started
  const verificationStartTimeRef = useRef<number>(0);
  // Add a reference to track the last processed deviceStatus timestamp
  const lastProcessedUpdateRef = useRef<string>("");
  
  const [hourOn, setHourOn] = useState(deviceStatus?.hour_on || 0);
  const [minuteOn, setMinuteOn] = useState(deviceStatus?.minute_on || 0);
  const [hourOff, setHourOff] = useState(deviceStatus?.hour_off || 0);
  const [minuteOff, setMinuteOff] = useState(deviceStatus?.minute_off || 0);

  // Reset verification state
  const resetVerification = () => {
    setVerifying(false);
    setMismatchCount(0);
    setExpectedValues({});
    setVerificationError(false);
    verificationStartTimeRef.current = 0;
  };

  // Update state values when deviceStatus changes
  useEffect(() => {
    if (deviceStatus) {
      // Skip duplicate updates (websocket might send same data multiple times)
      if (deviceStatus.timestamp === lastProcessedUpdateRef.current) {
        return;
      }
      
      lastProcessedUpdateRef.current = deviceStatus.timestamp;
      
      // If we're in verification mode, check if values match expected
      if (verifying && Object.keys(expectedValues).length > 0) {
        // Only process updates that came after our verification started
        const updateTime = new Date(deviceStatus.timestamp).getTime();
        
        if (updateTime > verificationStartTimeRef.current) {
          let matches = true;
          
          // Check each expected value
          Object.entries(expectedValues).forEach(([key, value]) => {
            if (deviceStatus[key as keyof DeviceStatus] != value) {
              matches = false;
            }
          });

          if (matches) {
            // Success! Update local state and exit verification
            setLocalDeviceStatus(deviceStatus);
            resetVerification();
          } else {
            // Mismatch detected - only count if this is a new update after our command
            if (mismatchCount < 2) {
              // First mismatch - ignore and increment counter
              setMismatchCount(mismatchCount + 1);
            } else {
              // Continued mismatch - show error
              setVerificationError(true);
              setLocalDeviceStatus(deviceStatus);
              // Reset verification but keep error state
              setVerifying(false);
              setMismatchCount(0);
              setExpectedValues({});
            }
          }
        } else {
          // This is an update from before our command, don't count for verification
          // Still update the UI with latest data if not in verification
          setLocalDeviceStatus(deviceStatus);
        }
      } else {
        // Normal update (not verifying)
        setLocalDeviceStatus(deviceStatus);

        // Only update form values if not currently editing
        if (!editingSchedule) {
          setHourOn(deviceStatus.hour_on || 0);
          setMinuteOn(deviceStatus.minute_on || 0);
          setHourOff(deviceStatus.hour_off || 0);
          setMinuteOff(deviceStatus.minute_off || 0);
        }
      }
    }
  }, [deviceStatus, editingSchedule, verifying, expectedValues, mismatchCount]);

  // Add timeout for verification to avoid being stuck in verification mode
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (verifying) {
      // Set a timeout to exit verification mode after 10 seconds if no matching update is received
      timeoutId = setTimeout(() => {
        if (verifying) {
          setVerificationError(true);
          setVerifying(false);
          setExpectedValues({});
          setMismatchCount(0);
        }
      }, 10000); // 10 second timeout
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [verifying]);

  if (!apiContext || !wsContext) return null;

  const isIdle = verifying || localDeviceStatus?.state === "";
  const isConnected = localDeviceStatus?.state !== "Mất kết nối";

  const handleTogglePower = async () => {
    if (!localDeviceStatus || isIdle) return;
    setLoading(true);
    setVerificationError(false);

    // Optimistically update UI
    const newToggleState = !localDeviceStatus.toggle;
    setLocalDeviceStatus({
      ...localDeviceStatus,
      toggle: newToggleState,
      state: "" // Set to idle state
    });

    try {
      await apiContext.toggleDevice(device._id, newToggleState);
      addToast("success", `Đã ${newToggleState ? "bật" : "tắt"} thiết bị`);
      
      // Set verification state with current timestamp
      verificationStartTimeRef.current = Date.now();
      setVerifying(true);
      setExpectedValues({ toggle: newToggleState, state: newToggleState ? "Thiết bị hoạt động" : "Thiết bị tắt" });
      
    } catch (err) {
      console.error("Lỗi khi thay đổi trạng thái:", err);
      addToast("error", "Không thể thay đổi trạng thái");

      // Revert on failure
      setLocalDeviceStatus({
        ...localDeviceStatus,
        toggle: !newToggleState,
        state: !newToggleState ? "Thiết bị hoạt động" : "Thiết bị tắt"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAuto = async () => {
    if (!localDeviceStatus || isIdle) return;
    setLoading(true);
    setVerificationError(false);

    // Optimistically update UI
    const newAutoState = !localDeviceStatus.auto;
    setLocalDeviceStatus({
      ...localDeviceStatus,
      auto: newAutoState,
      state: "" // Set to idle state
    });

    try {
      await apiContext.setDeviceAuto(device._id, newAutoState);
      addToast("success", `Đã ${newAutoState ? "bật" : "tắt"} chế độ tự động`);
      
      // Set verification state with current timestamp
      verificationStartTimeRef.current = Date.now();
      setVerifying(true);
      setExpectedValues({ auto: newAutoState });
      
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

  const startEditing = () => {
    setEditingSchedule(true);
  };

  const cancelEditing = () => {
    // Reset form values to match current device status
    if (localDeviceStatus) {
      setHourOn(localDeviceStatus.hour_on || 0);
      setMinuteOn(localDeviceStatus.minute_on || 0);
      setHourOff(localDeviceStatus.hour_off || 0);
      setMinuteOff(localDeviceStatus.minute_off || 0);
    }
    setEditingSchedule(false);
  };

  const handleSetSchedule = async () => {
    if (!localDeviceStatus || isIdle) return;
    setLoading(true);
    setVerificationError(false);

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
      ...newSchedule,
      state: "" // Set to idle state
    });

    try {
      await apiContext.setDeviceSchedule(device._id, newSchedule);
      addToast("success", "Lịch trình đã được cập nhật");
      setEditingSchedule(false); // Exit edit mode after successful save
      
      // Set verification state with current timestamp
      verificationStartTimeRef.current = Date.now();
      setVerifying(true);
      setExpectedValues(newSchedule);
      
    } catch (err) {
      console.error("Lỗi khi đặt lịch trình:", err);
      addToast("error", "Không thể đặt lịch trình");

      // Revert UI on failure
      setLocalDeviceStatus({
        ...localDeviceStatus,
        ...originalSchedule
      });
    } finally {
      setLoading(false);
    }
  };

  const getDeviceStateColor = () => {
    if (verificationError) return "bg-orange-500";
    if (!isConnected) return "bg-gray-500";
    if (isIdle) return "bg-yellow-500";
    if (localDeviceStatus?.state === "Thiết bị hoạt động") return "bg-green-500";
    return "bg-red-500";
  };

  const getDeviceStateText = () => {
    if (verificationError) return "Lỗi đồng bộ";
    if (!isConnected) return "Mất kết nối";
    if (isIdle) return "Đang đồng bộ";
    if (localDeviceStatus?.state === "Thiết bị hoạt động") return "Đang bật";
    if (localDeviceStatus?.state === "Thiết bị tắt") return "Đang tắt";
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
      </div>

      {/* Display verification error message */}
      {verificationError && (
        <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-2 text-sm">
          <p>Thiết bị không đồng bộ được với cài đặt. Vui lòng kiểm tra lại.</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-1" 
            onClick={resetVerification}
          >
            Đặt lại
          </Button>
        </div>
      )}

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
              disabled={!isConnected || isIdle || (!editingSchedule && isConnected)}
            />
            <Input
              type="number"
              placeholder="Phút bật"
              value={minuteOn}
              onChange={(e) => setMinuteOn(Number(e.target.value))}
              min={0}
              max={59}
              disabled={!isConnected || isIdle || (!editingSchedule && isConnected)}
            />
            <Input
              type="number"
              placeholder="Giờ tắt"
              value={hourOff}
              onChange={(e) => setHourOff(Number(e.target.value))}
              min={0}
              max={23}
              disabled={!isConnected || isIdle || (!editingSchedule && isConnected)}
            />
            <Input
              type="number"
              placeholder="Phút tắt"
              value={minuteOff}
              onChange={(e) => setMinuteOff(Number(e.target.value))}
              min={0}
              max={59}
              disabled={!isConnected || isIdle || (!editingSchedule && isConnected)}
            />
          </div>

          <div className="flex gap-2">
            {!editingSchedule ? (
              <Button
                variant="default"
                onClick={startEditing}
                disabled={loading || !isConnected || isIdle}
                className="w-full"
              >
                Chỉnh lịch hoạt động
              </Button>
            ) : (
              <>
                <Button
                  variant="default"
                  onClick={handleSetSchedule}
                  disabled={loading || !isConnected || isIdle}
                  className="flex-1"
                >
                  Xác nhận
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelEditing}
                  disabled={loading}
                  className="flex-1"
                >
                  Hủy
                </Button>
              </>
            )}
          </div>

          {isIdle && (
            <p className="text-xs text-yellow-600 text-center mt-2">
              Thiết bị đang đồng bộ. Vui lòng đợi để điều khiển.
            </p>
          )}
          {!isConnected && (
            <p className="text-xs text-red-600 text-center mt-2">
              Mất kết nối với thiết bị. Không thể điều khiển.
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
            <p className="text-sm text-gray-600">Chỉ số công tơ</p>
            <p className="font-medium">
              {localDeviceStatus?.energy_meter || "N/A"} kWh
            </p>
          </div>
        </div>
      )}
    </div>
  );
};