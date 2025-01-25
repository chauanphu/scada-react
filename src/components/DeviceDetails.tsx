import React, { useState } from "react";
import { Device } from "../lib/api";
import { DeviceStatus } from "../types/Cluster";
import { useAPI } from "../contexts/APIProvider";
import { useWebSocket } from "../contexts/WebsocketProvider";

interface DeviceDetailsProps {
  device: Device;
  deviceStatus: DeviceStatus | undefined;
}

export const DeviceDetails: React.FC<DeviceDetailsProps> = ({
  device,
  deviceStatus,
}) => {
  const apiContext = useAPI();
  const wsContext = useWebSocket();
  const [loading, setLoading] = useState(false);

  if (!apiContext || !wsContext) return null;

  const handleTogglePower = async () => {
    if (!deviceStatus) return;
    setLoading(true);
    try {
      await wsContext.sendCommand(device._id, "toggle", !deviceStatus.is_on);
    } catch (error) {
      console.error("Failed to toggle power:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAuto = async () => {
    if (!deviceStatus) return;
    setLoading(true);
    try {
      await wsContext.sendCommand(device._id, "auto", !deviceStatus.is_auto);
    } catch (error) {
      console.error("Failed to toggle auto mode:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">{device.name}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Device Info</h3>
          <div className="space-y-2">
            <p>
              <span className="font-medium">MAC Address:</span> {device.mac}
            </p>
            <p>
              <span className="font-medium">Location:</span>{" "}
              {device.latitude && device.longitude
                ? `${device.latitude}, ${device.longitude}`
                : "Not set"}
            </p>
            <p>
              <span className="font-medium">Created:</span>{" "}
              {device.created_at ? new Date(device.created_at).toLocaleString() : "N/A"}
            </p>
          </div>
        </div>

        {deviceStatus && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Status</h3>
            <div className="space-y-4">
              <div>
                <p className="mb-2">
                  <span className="font-medium">Connection:</span>{" "}
                  <span
                    className={
                      deviceStatus.is_connected ? "text-green-600" : "text-red-600"
                    }
                  >
                    {deviceStatus.is_connected ? "Connected" : "Disconnected"}
                  </span>
                </p>
                <button
                  onClick={handleTogglePower}
                  disabled={loading || !deviceStatus.is_connected}
                  className={`w-full py-2 px-4 rounded-md font-medium ${
                    deviceStatus.is_on
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-green-600 text-white hover:bg-green-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {deviceStatus.is_on ? "Turn Off" : "Turn On"}
                </button>
              </div>

              <div>
                <p className="mb-2">
                  <span className="font-medium">Mode:</span>{" "}
                  {deviceStatus.is_auto ? "Automatic" : "Manual"}
                </p>
                <button
                  onClick={handleToggleAuto}
                  disabled={loading || !deviceStatus.is_connected}
                  className={`w-full py-2 px-4 rounded-md font-medium ${
                    deviceStatus.is_auto
                      ? "bg-yellow-600 text-white hover:bg-yellow-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {deviceStatus.is_auto ? "Switch to Manual" : "Switch to Auto"}
                </button>
              </div>

              {deviceStatus.power > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Power Usage</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-2 rounded">
                      <p className="text-gray-600">Power</p>
                      <p className="font-medium">{deviceStatus.power}W</p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-gray-600">Current</p>
                      <p className="font-medium">{deviceStatus.current}A</p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-gray-600">Voltage</p>
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