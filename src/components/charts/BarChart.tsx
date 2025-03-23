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
import { useAPI } from "../../contexts/APIProvider";
import { getEnergyReport, formatEnergyData } from "../../lib/report.api";

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
  scaleToMaxValue?: boolean; // Optional prop to enable custom scaling
}

export const BarChart: React.FC<BarChartProps> = ({ 
  deviceId, 
  filters, 
  title,
  scaleToMaxValue = false 
}) => {
  const [data, setData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const apiContext = useAPI();

  useEffect(() => {
    const fetchData = async () => {
      if (!apiContext?.token || !deviceId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Use the getEnergyReport function from report.api.ts
        const energyData = await getEnergyReport(
          apiContext.token,
          {
            device_id: deviceId,
            aggregation: filters.aggregation,
            start_date: filters.startDate,
            end_date: filters.endDate
          }
        );
        
        if (!Array.isArray(energyData)) {
          console.error('Unexpected response format (not an array):', energyData);
          throw new Error('Received invalid data format from server');
        }
        
        // Use the updated formatEnergyData function
        const { values, labels } = formatEnergyData(energyData, filters.aggregation);
        setData(values);
        setLabels(labels);
      } catch (error) {
        console.error("Error fetching energy data:", error);
        setError("Không thể tải dữ liệu năng lượng");
        
        // For development - show more details in console
        if (process.env.NODE_ENV !== 'production') {
          setError(`Không thể tải dữ liệu: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceId, filters, apiContext?.token]);

  // Process data and determine appropriate energy unit
  const processedData = useMemo(() => {
    // Find max value in raw data (in Wh)
    const dataMax = Math.max(...data, 0);
    
    // Determine if we should use Wh or kWh
    // Data is already in kWh, but convert to Wh for small values for better readability
    const useWattHours = dataMax < 1;
    const unit = useWattHours ? 'Wh' : 'kWh';
    
    // Scale data appropriately
    const scaledData = useWattHours 
      ? data.map(val => parseFloat((val * 1000).toFixed(1))) // Convert to Wh for better readability of small values
      : data.map(val => parseFloat(val.toFixed(2))); // Keep as kWh but format for display
    
    // Calculate max value for y-axis
    let yAxisMax;
    const scaledDataMax = Math.max(...scaledData, 0);
    
    if (scaleToMaxValue && scaledDataMax > 0) {
      // Add a small percentage to the max value for better visualization
      yAxisMax = useWattHours 
        ? scaledDataMax * 1.2 
        : scaledDataMax * 1.2;
    } else {
      yAxisMax = undefined; // Let Chart.js determine the appropriate scale
    }
    
    return { 
      chartData: scaledData, 
      unit, 
      yAxisMax,
      rawData: data // Keep original data for reference if needed
    };
  }, [data, scaleToMaxValue]);

  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data: processedData.chartData,
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
        title: { display: true, text: `Năng lượng (${processedData.unit})` },
        min: 0,
        max: processedData.yAxisMax,
        ticks: {
          callback: function(this: any, tickValue: string | number) {
            if (typeof tickValue === "number") {
              return tickValue.toFixed(1) + ` ${processedData.unit}`;
            }
            return tickValue;
          }
        }
      },
    },
  };

  if (loading) return <div className="flex items-center justify-center h-full">Đang tải...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return <Bar data={chartData} options={options} />;
};
