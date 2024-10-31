import { useWebSocket } from "../contexts/WebsocketProvider"; // Assuming WebSocketProvider is in context folder
import { Button } from "./ui/button";
import { Unit } from "../types/Cluster";
import { useEffect, useMemo, useState } from "react";
import { setCommand } from "../lib/api";
import Cookies from "js-cookie";

interface RightSidebarProps {
  selectedUnit: Unit | null;
}

export const RightSidebar = ({ selectedUnit }: RightSidebarProps) => {
  const socketContext = useWebSocket();
  const unitStatus = useMemo(() => {
    return socketContext?.unitStatus || {};
  }, [socketContext]);

  const toggleLight = socketContext?.toggleLight || (() => {});
  const toggleAuto = socketContext?.toggleAutomatic || (() => {});

  const [unitData, setUnitData] = useState({
    isConnected: false,
    isOn: false,
    isAutomatic: false,
    power: 0,
    current: 0,
    voltage: 0,
  });

  useEffect(() => {
    if (selectedUnit) {
      const {
        isConnected,
        isOn,
        isAutomatic,
        power,
        current,
        voltage,
        hour_on,
        hour_off,
        minute_off,
        minute_on,
      } = unitStatus[selectedUnit.id] || {};
      setUnitData({ isConnected, isOn, power, current, voltage, isAutomatic});
      setSchedule({
        hourOn: hour_on,
        minuteOn: minute_on,
        hourOff: hour_off,
        minuteOff: minute_off,
      });
    }
  }, [selectedUnit, unitStatus]);
  const [schedule, setSchedule] = useState({
    hourOn: 0,
    minuteOn: 0,
    hourOff: 0,
    minuteOff: 0,
  });
  const token = Cookies.get("token") || "";
  const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSchedule((prevState) => ({
      ...prevState,
      [name]: Number(value),
    }));
  };

  const handleSetSchedule = () => {
    if (unitData.isConnected && selectedUnit) {
      setCommand(token, selectedUnit.id, "schedule", schedule);
    }
  };

  const handleToggle = () => {
    if (unitData.isConnected && selectedUnit) {
      toggleLight(selectedUnit.id);
      setCommand(token, selectedUnit.id, "auto", false);
      setCommand(token, selectedUnit.id, "toggle", !unitData.isOn);
    }
  };

  const handleToggleAutomatic = () => {
    if (unitData.isConnected && selectedUnit) {
      setCommand(token, selectedUnit.id, "auto", !unitData.isAutomatic);
      toggleAuto(selectedUnit.id);
    }
  };
  if (!selectedUnit) {
    return (
      <div className="w-1/4 p-8 pt-[6rem] h-screen max-h-screen overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Thông tin</h3>
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <p className="text-lg font-semibold">
            Chọn thiết bị để xem thông tin chi tiết
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="w-1/4 p-8 pt-[6rem] h-screen max-h-screen overflow-y-auto">
      {" "}
      {/* Set height to screen with scroll */}
      <h3 className="text-lg font-semibold mb-4">
        Thông tin - {selectedUnit.name}
      </h3>
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <p className="text-lg font-semibold">
          Công suất tiêu thụ:
          <span className="font-normal ml-2">{unitData.power} W</span>
        </p>

        <p className="text-lg font-semibold">
          Điện áp đầu vào:
          <span className="font-normal ml-2">{unitData.voltage} V</span>
        </p>

        <p className="text-lg font-semibold">
          Dòng điện:
          <span className="font-normal ml-2">{unitData.current} A</span>
        </p>

        <p className="text-lg font-semibold">
          Trạng thái:
          <span
            className={`font-bold ml-2 ${
              unitData.isConnected
                ? unitData.isOn
                  ? "text-green-600"
                  : "text-gray-600"
                : "text-red-600"
            }`}
          >
            {unitData.isConnected
              ? unitData.isOn
                ? " Mở"
                : " Tắt"
              : " Mất kết nối"}
          </span>
        </p>
      </div>
      <div className="mt-6 flex items-center space-x-4">
        <span className="text-sm font-semibold">Tắt</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={unitData.isOn ?? false}
            onChange={handleToggle}
            disabled={!unitData.isConnected}
            className="sr-only peer"
          />
          <div
            className={`w-11 h-6 bg-gray-200 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-checked:bg-green-600
            peer-disabled:opacity-50 peer-disabled:cursor-not-allowed`}
          />
          <div
            className={`absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform
            peer-checked:translate-x-full peer-checked:border-white border-gray-300`}
          />
        </label>
        <span className="text-sm font-semibold">Mở</span>
      </div>
      <div className="mt-6 flex items-center space-x-4">
        <span className="text-sm font-semibold">Theo hẹn giờ</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={unitData.isAutomatic ?? false}
            onChange={handleToggleAutomatic}
            disabled={!unitData.isConnected}
            className="sr-only peer"
          />
          <div
            className={`w-11 h-6 bg-gray-200 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-checked:bg-green-600
      peer-disabled:opacity-50 peer-disabled:cursor-not-allowed`}
          />
          <div
            className={`absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform
      peer-checked:translate-x-full peer-checked:border-white border-gray-300`}
          />
        </label>
      </div>
      <div className="mt-8">
        <h4 className="text-lg font-semibold mb-2">Hẹn giờ</h4>

        <div className="space-y-4">
          {/* ON Time Input */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Bật</label>
            <div className="flex space-x-2 items-center">
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  name="hourOn"
                  value={schedule.hourOn ?? 0}
                  onChange={handleScheduleChange}
                  min={0}
                  max={24}
                  className="w-16 p-2 border rounded text-center"
                  placeholder="HH"
                />
                <small className="text-xs text-gray-500">Giờ</small>{" "}
                {/* Label for Hours */}
              </div>
              <span>:</span>
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  name="minuteOn"
                  value={schedule.minuteOn ?? 0}
                  onChange={handleScheduleChange}
                  min={0}
                  max={59}
                  className="w-16 p-2 border rounded text-center"
                  placeholder="MM"
                />
                <small className="text-xs text-gray-500">Phút</small>{" "}
                {/* Label for Minutes */}
              </div>
            </div>
          </div>

          {/* OFF Time Input */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Tắt</label>
            <div className="flex space-x-2 items-center">
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  name="hourOff"
                  value={schedule.hourOff ?? 0}
                  onChange={handleScheduleChange}
                  min={0}
                  max={24}
                  className="w-16 p-2 border rounded text-center"
                  placeholder="HH"
                />
                <small className="text-xs text-gray-500">Giờ</small>{" "}
                {/* Label for Hours */}
              </div>
              <span>:</span>
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  name="minuteOff"
                  value={schedule.minuteOff ?? 0}
                  onChange={handleScheduleChange}
                  min={0}
                  max={59}
                  className="w-16 p-2 border rounded text-center"
                  placeholder="MM"
                />
                <small className="text-xs text-gray-500">Phút</small>{" "}
                {/* Label for Minutes */}
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={handleSetSchedule}
          disabled={!unitData.isConnected}
          className={`mt-4 w-full ${
            !unitData.isConnected ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {unitData.isConnected ? "Lưu hẹn" : "Mất kết nối"}
        </Button>
      </div>
    </div>
  );
};
