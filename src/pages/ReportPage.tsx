"use client";

import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2"; // Change import from Line to Bar
import "chart.js/auto";
import Cookies from "js-cookie";
import { EnergyData } from "../types/Report";
import { getEnergyData, View } from "../lib/api";
import { Navbar } from "../components/NavBar";
import { useAPI } from "../contexts/APIProvider";
import { useNavigate, useParams } from 'react-router-dom';
import { getClusters } from "../lib/api";
import { Unit } from "../types/Cluster";

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
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [view, setView] = useState<View>(View.HOURLY);
  const apiContext = useAPI();
  const permissions = apiContext?.permissions || [];

  // Fetch units when component mounts
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const token = Cookies.get("token") || "";
        const clusters = await getClusters(token);
        const allUnits = clusters.flatMap(cluster => cluster.units);
        setUnits(allUnits);
      } catch (error) {
        console.error("Error fetching units:", error);
      }
    };

    fetchUnits();
  }, []);

  useEffect(() => {
    if (!unitId) return; // Wait for unitId to be available

    // Fetch data from HTTP endpoint
    const fetchData = async () => {
      try {
        const token = Cookies.get("token") || "";
        const data: EnergyData[] = await getEnergyData(token, Number(unitId), view); // Pass unitId to getEnergyData
        const labels = data.map((item) => {
          const date = new Date(item.time);
          switch (view) {
            case View.HOURLY:
              // Format to show hour and date
              return date.toLocaleString("default", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
            case View.DAILY:
              // Format to show day and date
              return date.toLocaleString("default", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                day: "2-digit",
                month: "2-digit",
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
              backgroundColor: "rgba(75, 192, 192, 0.8)",
            },
          ],
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [view, unitId]); // Add unitId to dependency array

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
        beginAtZero: true, // Start y-axis from 0
      },
    },
    barPercentage: 0.8, // Adjust bar width
    categoryPercentage: 0.8, // Adjust spacing between bars
  };

  return (
    <>
      <Navbar permissions={permissions} />
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className="w-64 bg-gray-100 border-r p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Select Device</h2>
          <div className="space-y-2">
            {units.map((unit) => (
              <button
                key={unit.id}
                onClick={() => navigate(`/report/${unit.id}`)}
                className={`w-full text-left px-4 py-2 rounded ${
                  Number(unitId) === unit.id
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-200"
                }`}
              >
                {unit.name || `Device ${unit.id}`}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 overflow-y-auto">
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
            <Bar data={chartData} options={options} /> {/* Change Line to Bar */}
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportPage;
