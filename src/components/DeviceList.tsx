import React from "react";
import { Device } from "../lib/api";
import { DeviceStatus } from "../types/Cluster";

interface DeviceListProps {
  devices: Device[];
  deviceStatuses: { [key: string]: DeviceStatus };
  onDeviceSelect: (device: Device) => void;
  selectedDevice: Device | null;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  deviceStatuses,
  onDeviceSelect,
  selectedDevice,
}) => {
  return (
    <div className="space-y-2">
      {devices.map((device) => {
        const status = deviceStatuses[device._id];
        return (
          <div
            key={device._id}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              selectedDevice?._id === device._id
                ? "bg-blue-50 border-blue-500"
                : "bg-white hover:bg-gray-50 border-gray-200"
            } border`}
            onClick={() => onDeviceSelect(device)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">{device.name}</h3>
                <p className="text-sm text-gray-500">{device.mac}</p>
              </div>
              {status && (
                <div
                  className={`h-3 w-3 rounded-full ${
                    status.is_connected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
              )}
            </div>
            {status && (
              <div className="mt-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Power:</span>
                  <span>{status.is_on ? "On" : "Off"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span>{status.is_auto ? "Auto" : "Manual"}</span>
                </div>
                {status.power > 0 && (
                  <div className="flex justify-between">
                    <span>Usage:</span>
                    <span>{status.power}W</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}; 