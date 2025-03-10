import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Button } from "./ui/button";
import { PUBLIC_API_URL } from "../lib/api";
import { useAPI } from "../contexts/APIProvider";
import { Device } from "../types/Cluster";
import { Chart, registerables } from "chart.js";
import { EnergyData } from "../types/Report";
Chart.register(...registerables);

interface ReportFilters {
  startDate: string;
  endDate: string;
  aggregation: "hourly" | "daily" | "monthly";
}

enum View {
  HOURLY = "hourly",
  DAILY = "daily",
  MONTHLY = "monthly",
}

interface ReportViewProps {
  device: Device;
}

export const ReportView: React.FC<ReportViewProps> = ({ device }) => {
  const apiContext = useAPI();
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
    aggregation: "hourly",
  });
  const [reportData, setReportData] = useState<EnergyData[]>([]);

  const fetchReportData = async () => {
    if (!apiContext?.token) return;

    try {
      const response = await fetch(
        `${PUBLIC_API_URL}/report/?device_id=${device._id}` +
          `&start_date=${filters.startDate}&end_date=${filters.endDate}` +
          `&aggregation=${filters.aggregation}`,
        {
          headers: { Authorization: `Bearer ${apiContext.token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch report");
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error("Report fetch error:", err);
    }
  };

  useEffect(() => {
    void fetchReportData();
  }, [filters, device._id]);

  // Convert UTC timestamp to local timezone (UTC+7)
  const convertToLocalTime = (utcTimestamp: string) => {
    const date = new Date(utcTimestamp);
    const localTime = new Date(date.getTime() + 7 * 60 * 60 * 1000); // Add 7 hours for UTC+7
    return localTime;
  };

  const labels = reportData.map((item) => {
    const localDate = convertToLocalTime(item.timestamp); // Convert to local time
    switch (filters.aggregation) {
      case View.HOURLY:
        // Format to show hour and minute in local time
        return localDate.toLocaleString("default", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      case View.DAILY:
        // Format to show day and month in local time
        return localDate.toLocaleString("default", {
          day: "2-digit",
          month: "2-digit",
        });
      case View.MONTHLY:
        // Format to show month and year in local time
        return localDate.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
      default:
        return localDate.toLocaleDateString();
    }
  });

  const energyData = reportData.map((item) => item.total_energy);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Energy Consumption",
        data: energyData,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: "Time",
        },
      },
      y: {
        title: {
          display: true,
          text: "Total Energy (kWh)",
        },
      },
    },
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Filters Section */}
      <div className="flex flex-col md:flex-row flex-wrap gap-4 items-center">
        <input
          type="date"
          value={filters.startDate.split("T")[0]}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, startDate: e.target.value }))
          }
          className="p-2 border rounded w-full md:w-auto"
        />
        <input
          type="date"
          value={filters.endDate.split("T")[0]}
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
              aggregation: e.target.value as any,
            }))
          }
          className="p-2 border rounded w-full md:w-auto"
        >
          <option value="hourly">Theo giờ</option>
          <option value="daily">Theo ngày</option>
          <option value="monthly">Theo tháng</option>
        </select>
        <Button
          onClick={fetchReportData}
          size="sm"
          className="w-full md:w-auto"
        >
          Tải lại
        </Button>
      </div>

      {/* Chart Section */}
      {reportData.length > 0 ? (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px] h-[400px] md:h-[500px]">
            <Line data={chartData} options={options} />
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          No report data available
        </div>
      )}
    </div>
  );
};