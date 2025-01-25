import React, { useEffect, useState } from "react";
import { useAPI } from "../contexts/APIProvider";
import { Navbar } from "../components/NavBar";
import { getEnergyData, Device } from "../lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface EnergyData {
  timestamp: string;
  power: number;
  current: number;
  voltage: number;
  total_energy: number;
}

export const EnergyPage: React.FC = () => {
  const apiContext = useAPI();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (selectedDevice) {
      fetchEnergyData();
    }
  }, [selectedDevice, startDate, endDate]);

  const fetchEnergyData = async () => {
    if (!selectedDevice) return;

    try {
      const token = apiContext?.token || "";
      const data = await getEnergyData(
        token,
        selectedDevice.id,
        startDate,
        endDate
      );
      setEnergyData(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch energy data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-4">Energy Consumption</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Device
                </label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={selectedDevice?.id || ""}
                  onChange={(e) => {
                    const device = devices.find(
                      (d) => d.id === Number(e.target.value)
                    );
                    setSelectedDevice(device || null);
                  }}
                >
                  <option value="">Select a device</option>
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div>Loading...</div>
          ) : (
            selectedDevice && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-medium mb-4">Power Consumption</h2>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={energyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={formatDate}
                          angle={-45}
                          textAnchor="end"
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={formatDate}
                          formatter={(value: number) => [
                            `${value.toFixed(2)} W`,
                            "Power",
                          ]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="power"
                          stroke="#8884d8"
                          name="Power (W)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-medium mb-4">
                    Current and Voltage
                  </h2>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={energyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={formatDate}
                          angle={-45}
                          textAnchor="end"
                        />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip
                          labelFormatter={formatDate}
                          formatter={(value: number, name: string) => [
                            `${value.toFixed(2)} ${
                              name === "Current" ? "A" : "V"
                            }`,
                            name,
                          ]}
                        />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="current"
                          stroke="#82ca9d"
                          name="Current (A)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="voltage"
                          stroke="#ffc658"
                          name="Voltage (V)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-medium mb-4">Total Energy</h2>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={energyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={formatDate}
                          angle={-45}
                          textAnchor="end"
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={formatDate}
                          formatter={(value: number) => [
                            `${value.toFixed(2)} kWh`,
                            "Total Energy",
                          ]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="total_energy"
                          stroke="#ff7300"
                          name="Total Energy (kWh)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}; 