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

const getDefaultStartDate = (view: View) => {
  const today = new Date();
  const startDate = new Date();
  
  switch (view) {
    case View.HOURLY:
      startDate.setDate(today.getDate() - 1); // 1 day ago
      break;
    case View.DAILY:
      startDate.setDate(today.getDate() - 30); // 30 days ago
      break;
    case View.MONTHLY:
      startDate.setFullYear(today.getFullYear() - 1); // 1 year ago
      break;
    default:
      startDate.setDate(today.getDate() - 1);
  }
  
  return startDate.toISOString().split('T')[0];
};

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
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [startDate, setStartDate] = useState<string>(getDefaultStartDate(View.HOURLY));
  const [endDate, setEndDate] = useState<string>(new Date().toISOString());

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
        // Fetch current period data only
        const currentData: EnergyData[] = await getEnergyData(
          token, 
          Number(unitId), 
          view,
          startDate,
          endDate
        );

        const formatDate = (date: Date) => {
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
                // hour: "2-digit",
                // minute: "2-digit",
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
                // day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });
            default:
              return date.toLocaleDateString();
          }
        };

        // Set current period chart data only
        const currentLabels = currentData.map(item => formatDate(new Date(item.time)));
        const currentEnergyData = currentData.map(item => item.total_energy);
        setChartData({
          labels: currentLabels,
          datasets: [{
            label: "Biểu đồ tiêu thụ điện",
            data: currentEnergyData,
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.8)",
          }],
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [view, unitId, startDate, endDate]); // Add unitId to dependency array

  // Add effect to update startDate when view changes
  useEffect(() => {
    setStartDate(getDefaultStartDate(view));
  }, [view]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: false,
          text: "Thời gian",
        },
      },
      y: {
        title: {
          display: true,
          text: "Tổng tiêu thụ (kWh)",
        },
        beginAtZero: true, // Start y-axis from 0
      },
    },
    barPercentage: 0.8, // Adjust bar width
    categoryPercentage: 0.8, // Adjust spacing between bars
  };

  return (
    <>
      {/* Add pt-14 to account for fixed navbar height */}
      <div className="flex h-screen pt-14">
        {/* Sidebar */}
        <div className={`
          transition-all duration-300 ease-in-out
          bg-gray-100 border-r p-4 overflow-y-auto
          fixed left-0 h-[calc(100vh-3.5rem)] top-14
          ${isSidebarOpen ? 'w-64' : 'w-16'}
        `}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg font-semibold ${!isSidebarOpen && 'hidden'}`}>
              Chọn thiết bị
            </h2>
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded hover:bg-gray-200"
            >
              {isSidebarOpen ? '←' : '→'}
            </button>
          </div>
          <div className="space-y-2">
            {isSidebarOpen && units.map((unit) => (
              <button
                key={unit.id}
                onClick={() => navigate(`/report/${unit.id}`)}
                className={`w-full text-left px-4 py-2 rounded truncate ${
                  Number(unitId) === unit.id
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-200"
                }`}
                title={unit.name || `Device ${unit.id}`}
              >
                {isSidebarOpen 
                  ? (unit.name || `Device ${unit.id}`)
                  : (unit.name?.[0] || unit.id)}
              </button>
            ))}
          </div>
        </div>

        {/* Main content - add margin left to account for sidebar */}
        <div className={`
          flex-1 p-4 overflow-y-auto
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'ml-64' : 'ml-16'}
        `}>
          <h1 className="text-2xl font-bold mb-4">Báo cáo tiêu thụ điện</h1>
          <div className="mb-4 flex gap-4 items-center">
            <select
              value={view}
              onChange={(e) => {
                const newView = e.target.value as View;
                setView(newView);
                // startDate will be updated by the useEffect
              }}
              className="p-2 border rounded"
            >
              <option value={View.HOURLY}>Theo giờ</option>
              <option value={View.DAILY}>Theo ngày</option>
              <option value={View.MONTHLY}>Theo tháng</option>
            </select>

            <div className="flex gap-2 items-center">
              <label>Từ:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-2 border rounded"
              />
            </div>

            <div className="flex gap-2 items-center">
              <label>Đến:</label>
              <input
                type="date"
                value={endDate.split('T')[0]}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-2 border rounded"
              />
            </div>
          </div>
          
          {/* Current period chart */}
          <div className="h-80 mb-8">
            <Bar data={chartData} options={options} />
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportPage;
