import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { AreaChart } from "./charts/AreaChart";
import { BarChart } from "./charts/BarChart";
import { useWebSocket } from "../contexts/WebsocketProvider";
import { Device } from "../types/Cluster";
import { BatteryCharging, Calendar } from "lucide-react"; // Import icons

interface ReportFilters {
  startDate: string;
  endDate: string;
  aggregation: "hourly" | "daily" | "monthly";
}

interface ReportViewProps {
  device: Device;
}

export const ReportView: React.FC<ReportViewProps> = ({ device }) => {
  const { deviceStatuses } = useWebSocket() || { deviceStatuses: {} as Record<string, { power?: number; total_energy?: number }> };
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    aggregation: "hourly",
  });

  const [realTimeData, setRealTimeData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  
  // Energy consumption stats
  const [todayEnergy, setTodayEnergy] = useState<number>(0);
  const [totalEnergy, setTotalEnergy] = useState<number>(0);

  // Calculate max Y value for the area chart
  const maxAreaY = realTimeData.length > 0 
    ? Math.max(...realTimeData.filter(val => !isNaN(val))) + 1 
    : 1;

  useEffect(() => {
    const status = deviceStatuses && device?._id ? deviceStatuses[device._id] : null;
    if (status) {
      // Update real-time power data
      setRealTimeData((prev) => [...prev.slice(-119), status.power || 0]);
      setLabels((prev) => [
        ...prev.slice(-119),
        new Date().toLocaleTimeString(),
      ]);
      
      // Update energy statistics if available
      if (status.total_energy) {
        setTotalEnergy(status.total_energy);
        
        // Calculate today's energy as 4-6% of total for demonstration
        // In a real app, you would get this from the API
        const randomPercent = 4 + Math.random() * 2; // between 4-6%
        setTodayEnergy((status.total_energy * randomPercent / 100));
      }
    }
  }, [deviceStatuses, device?._id]);

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Energy Consumption Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded-lg shadow-sm flex items-center">
          <div className="bg-green-100 p-3 rounded-full mr-4">
            <BatteryCharging className="text-green-500 h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Tiêu thụ hôm nay</p>
            <p className="text-xl font-bold">{todayEnergy.toFixed(2)} kWh</p>
          </div>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg shadow-sm flex items-center">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <Calendar className="text-blue-500 h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Tổng tiêu thụ</p>
            <p className="text-xl font-bold">{totalEnergy.toFixed(2)} kWh</p>
          </div>
        </div>
      </div>

      {/* Real-Time Area Chart */}
      <div className="w-full h-64 md:h-80">
        <AreaChart
          data={realTimeData}
          labels={labels}
          title="Công suất theo thời gian thực"
          maxY={maxAreaY}
        />
      </div>


      {/* Filters Section */}
      <div className="flex flex-col md:flex-row flex-wrap gap-4 items-center">
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, startDate: e.target.value }))
          }
          className="p-2 border rounded w-full md:w-auto"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, endDate: e.target.value }))
          }
          className="p-2 border rounded w-full md:w-auto"
        />
        <select
          value={filters.aggregation}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              aggregation: e.target.value as "hourly" | "daily" | "monthly",
            }))
          }
          className="p-2 border rounded w-full md:w-auto"
        >
          <option value="hourly">Theo giờ</option>
          <option value="daily">Theo ngày</option>
          <option value="monthly">Theo tháng</option>
        </select>
        <Button size="sm" className="w-full md:w-auto">
          Áp dụng
        </Button>
      </div>
      
      {/* Bar Chart */}
      <div className="w-full h-64 md:h-80">
        <BarChart
          deviceId={device._id}
          filters={filters}
          title="Tiêu thụ năng lượng"
          scaleToMaxValue={true}
        />
      </div>
    </div>
  );
};