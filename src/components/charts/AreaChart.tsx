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
  maxY?: number; // Optional prop for custom y-axis scaling
}

export const AreaChart: React.FC<AreaChartProps> = ({ data, labels, title, maxY }) => {
  // Determine unit and adjust data based on magnitude
  const { chartData, unit, yAxisMax } = useMemo(() => {
    // Find max value
    const dataMax = Math.max(...data.filter(val => !isNaN(val)), 0);
    
    // Determine if we should use W or kW
    const useWatts = dataMax < 100;
    const unit = useWatts ? 'W' : 'kW';
    
    // Calculate y-axis max
    const calculatedMax = maxY !== undefined 
      ? maxY 
      : dataMax + 1;
    
    // Scale data if needed
    const scaledData = useWatts 
      ? data // Keep as watts
      : data.map(value => value / 1000); // Convert to kW
    
    return { 
      chartData: scaledData,
      unit,
      yAxisMax: useWatts ? calculatedMax : calculatedMax / 1000
    };
  }, [data, maxY]);

  const chartOptions = {
    labels,
    datasets: [
      {
        label: title,
        data: chartData,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.8)",
        fill: true,
        tension: 0, // Changed from 0.4 to 0 for straight lines
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
            // Format time string to HH:MM:SS format with 24-hour clock (0-23)
            const timeString = labels[index];
            if (!timeString) return '';
            
            try {
              // Manual formatting to ensure 24-hour format
              const timeParts = timeString.split(':');
              if (timeParts.length >= 2) {
                let hours = parseInt(timeParts[0], 10);
                let minutes = parseInt(timeParts[1], 10);
                let seconds = timeParts.length >= 3 ? parseInt(timeParts[2], 10) : 0;
                
                // Check if this is a 12-hour format with AM/PM
                const isPM = timeString.toLowerCase().includes('pm');
                const isAM = timeString.toLowerCase().includes('am');
                
                // Convert to 24-hour if needed
                if (isPM && hours < 12) {
                  hours += 12;
                } else if (isAM && hours === 12) {
                  hours = 0;
                }
                
                // Format with zero-padding
                const formattedHours = hours.toString().padStart(2, '0');
                const formattedMinutes = minutes.toString().padStart(2, '0');
                const formattedSeconds = seconds.toString().padStart(2, '0');
                
                return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
              }
              
              // Fallback - direct string manipulation for simple cases
              return timeString.replace(/\s?(am|pm)\s?/i, '');
            } catch (e) {
              return timeString; // Return original if parsing fails
            }
          },
          maxTicksLimit: 6, // Limit the number of ticks shown on x-axis
        }
      },
      y: { 
        title: { display: true, text: `Công suất (${unit})` },
        min: 0,
        max: yAxisMax,
        ticks: {
          callback: function(tickValue: string | number, _index: number, _ticks: any[]) {
            if (typeof tickValue === 'number') {
              return tickValue.toFixed(1) + ` ${unit}`;
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

  return <Line data={chartOptions} options={options} />;
};
