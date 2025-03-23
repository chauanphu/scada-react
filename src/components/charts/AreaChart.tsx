import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register components in the correct order
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler
);

interface AreaChartProps {
  data: number[];
  labels: string[];
  title: string;
}

export const AreaChart: React.FC<AreaChartProps> = ({ data, labels, title }) => {
  // Convert data from Wh to kWh
  const kwhData = useMemo(() => data.map(value => value / 1000), [data]);
  
  // Calculate max value for y-axis scaling (at least 1 kWh)
  const maxValue = useMemo(() => {
    const dataMax = Math.max(...kwhData, 0);
    return Math.max(dataMax, 1); // Minimum scale of 1 kWh
  }, [kwhData]);

  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data: kwhData, // Use kWh data
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.8)",
        fill: true,
        tension: 0.4,
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
          callback: function(_value: any, index: number, _values: any[]): string {
            // Only show hour markers for real-time data
            const timeString = labels[index];
            if (!timeString) return '';
            
            // Try to parse the time string as HH:MM:SS format
            const timeParts = timeString.split(':');
            if (timeParts.length >= 2) {
              return `${timeParts[0]}h`;
            }
            
            // Fallback: extract hours from other time formats
            const hourMatch = timeString.match(/(\d+):/);
            if (hourMatch && hourMatch[1]) {
              return `${hourMatch[1]}h`;
            }
            
            return '';
          },
          maxTicksLimit: 6, // Limit the number of ticks shown on x-axis
        }
      },
      y: { 
        title: { display: true, text: "Công suất (kW)" },
        min: 0,
        max: maxValue,
        ticks: {
          stepSize: 0.2, // 200 Wh = 0.2 kWh steps
          callback: function(tickValue: string | number, _index: number, _ticks: any[]) {
            if (typeof tickValue === 'number') {
              return tickValue.toFixed(1) + ' kW';
            }
            return tickValue;
          }
        }
      },
    },
    elements: {
      point: {
        radius: 2,
      },
    },
  };

  return <Line data={chartData} options={options} />;
};
