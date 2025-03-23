import React, { useEffect, useState, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { getEnergyData, View } from "../../lib/api";
import { useAPI } from "../../contexts/APIProvider";

// Register required components including Filler
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BarChartProps {
  deviceId: string;
  filters: { startDate: string; endDate: string; aggregation: "hourly" | "daily" | "monthly" };
  title: string;
}

export const BarChart: React.FC<BarChartProps> = ({ deviceId, filters, title }) => {
  const [data, setData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const apiContext = useAPI();

  useEffect(() => {
    const fetchData = async () => {
      if (!apiContext?.token) return;
      
      try {
        const energyData = await getEnergyData(
          apiContext.token, // Use token from context
          deviceId,
          filters.aggregation === 'hourly' ? View.HOURLY : 
            filters.aggregation === 'daily' ? View.DAILY : View.MONTHLY,
          filters.startDate,
          filters.endDate
        );
        
        setData(energyData.map((item) => item.total_energy));
        setLabels(energyData.map((item) => new Date(item.timestamp).toLocaleDateString('vi-VN')));
      } catch (error) {
        console.error("Error fetching energy data:", error);
        // Could add toast notification here
      }
    };

    fetchData();
  }, [deviceId, filters, apiContext?.token]);

  // Calculate max value and convert data to kWh
  const processedData = useMemo(() => {
    // Convert Wh to kWh
    const kwhData = data.map(value => value / 1000);
    
    // Calculate max value (at least 1 kWh)
    const maxValue = Math.max(...kwhData, 0);
    const yAxisMax = Math.max(maxValue, 1);
    
    return { kwhData, yAxisMax };
  }, [data]);

  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data: processedData.kwhData, // Use kWh data
        backgroundColor: "rgba(54, 162, 235, 0.8)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { 
        title: { display: true, text: "Thời gian" },
        ticks: {
          maxTicksLimit: 8, // Prevent overcrowding
        } 
      },
      y: { 
        title: { display: true, text: "Năng lượng (kWh)" },
        min: 0,
        max: processedData.yAxisMax,
        ticks: {
          stepSize: 0.2, // 200 Wh = 0.2 kWh steps
          callback: function(this: any, tickValue: string | number) {
            if (typeof tickValue === "number") {
              return tickValue.toFixed(1);
            }
            return tickValue;
          }
        }
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};
