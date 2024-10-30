"use client";

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import Cookies from "js-cookie";
import { EnergyData } from "../types/Report";
import { getEnergyData, View } from "../lib/api";
import { Navbar } from "../components/NavBar";
import { useAPI } from "../contexts/APIProvider";

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

const ReportPage: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [view, setView] = useState<View>(View.HOURLY);
  const apiContext = useAPI();
  const permissions = apiContext?.permissions || [];

  useEffect(() => {
    // Fetch data from HTTP endpoint
    const fetchData = async () => {
      try {
        const token = Cookies.get("token") || "";
        const data: EnergyData[] = await getEnergyData(token, view);

        const labels = data.map((item) => {
          const date = new Date(item.time);
          switch (view) {
            case View.HOURLY:
              // Format to show hour and date
              return date.toLocaleString("default", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                // day: "2-digit",
                // month: "2-digit",
                // year: "numeric",
              });
            case View.DAILY:
              // Format to show day and date
              return date.toLocaleString("default", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                day: "2-digit",
                month: "2-digit",
                // year: "numeric",
              });
            case View.WEEKLY:
              // Format to show week number or start of the week
              const weekStart = new Date(date);
              weekStart.setDate(date.getDate() - date.getDay());
              return `Week of ${weekStart.toLocaleDateString()}`;
            case View.MONTHLY:
              // Format to show month and year
              return date.toLocaleString("default", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              });
            default:
              return date.toLocaleDateString();
          }
        });
        const energyData = data.map((item) => item.total_energy);
        setChartData({
          labels: labels,
          datasets: [
            {
              label: "Energy Consumption",
              data: energyData,
              borderColor: "rgba(75, 192, 192, 1)",
              backgroundColor: "rgba(75, 192, 192, 0.2)",
            },
          ],
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [view]);

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
    <>
      <Navbar permissions={permissions} />

      <div className="container mx-auto p-4">

        <h1 className="text-2xl font-bold mb-4">Energy Consumption Report</h1>
        <div className="mb-4">
          <select
            value={view}
            onChange={(e) => setView(e.target.value as View)}
            className="p-2 border rounded"
          >
            <option value={View.HOURLY}>Theo giờ</option>
            <option value={View.DAILY}>Theo ngày</option>
            <option value={View.MONTHLY}>Theo tháng</option>
          </select>
        </div>
        <div className="h-96">
          <Line data={chartData} options={options} />
        </div>
      </div>
    </>
  );
};

export default ReportPage;
