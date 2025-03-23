import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register required components
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

interface LineChartProps {
  data: number[];
  labels: string[];
  title: string;
}

export const LineChart: React.FC<LineChartProps> = ({ data, labels, title }) => {
  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: "Time" } },
      y: { title: { display: true, text: "Power (kW)" } },
    },
  };

  return <Line data={chartData} options={options} />;
};
