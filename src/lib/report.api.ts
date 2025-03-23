import { PUBLIC_API_URL } from "./api";

// Energy data interface matching the API response
export interface EnergyData {
  timestamp: string;
  total_energy: number; // Energy consumption (Wh)
}

export type AggregationType = "hourly" | "daily" | "monthly";

export interface EnergyReportParams {
  device_id: string;
  aggregation: AggregationType;
  start_date?: string;
  end_date?: string;
}

/**
 * Fetches energy data based on provided parameters
 * @param token Authorization token
 * @param params Report parameters: device_id, aggregation, start_date, end_date
 * @returns Promise with array of EnergyData objects
 */
export const getEnergyReport = async (
  token: string,
  params: EnergyReportParams
): Promise<EnergyData[]> => {
  const queryParams = new URLSearchParams({
    device_id: params.device_id,
    aggregation: params.aggregation,
  });

  if (params.start_date) queryParams.append('start_date', params.start_date);
  if (params.end_date) queryParams.append('end_date', params.end_date);

  try {
    const response = await fetch(`${PUBLIC_API_URL}/report/?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Energy report API error (${response.status}):`, errorText);
      throw new Error(`Failed to fetch energy report data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching energy report:", error);
    throw new Error(error instanceof Error ? error.message : "Unknown error fetching energy report");
  }
};

/**
 * Formats energy data based on aggregation type and converts UTC to local timezone
 * @param data Array of EnergyData objects
 * @param aggregation Type of aggregation 
 * @returns Object with formatted data and labels
 */
export const formatEnergyData = (
  data: EnergyData[],
  aggregation: AggregationType
): { values: number[], labels: string[] } => {
  const values = data.map(item => item.total_energy);
  const labels = data.map(item => {
    try {
      // Ensure the timestamp has 'Z' appended to indicate UTC if it doesn't already
      const timestampStr = item.timestamp.endsWith('Z') 
        ? item.timestamp 
        : `${item.timestamp}Z`;
      
      // Create date object from UTC string
      const utcDate = new Date(timestampStr);
      
      // Check if date is valid
      if (isNaN(utcDate.getTime())) {
        console.warn(`Invalid timestamp format: ${item.timestamp}`);
        return item.timestamp;
      }
      
      // Format based on aggregation type with local timezone
      switch (aggregation) {
        case 'hourly':
          // For hourly, explicitly use local timezone formatting with hour/minute
          return utcDate.toLocaleTimeString(undefined, { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone 
          });
        case 'daily':
          return utcDate.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          });
        case 'monthly':
          return utcDate.toLocaleDateString(undefined, { 
            month: 'long', 
            year: 'numeric',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          });
        default:
          return utcDate.toLocaleString();
      }
    } catch (e) {
      console.error("Error formatting timestamp:", e);
      return item.timestamp; // Return original if there's an error
    }
  });

  return { values, labels };
};

/**
 * Converts watt-hours to kilowatt-hours
 * @param whValues Array of values in watt-hours
 * @returns Array of values converted to kilowatt-hours
 */
export const convertToKwh = (whValues: number[]): number[] => {
  return whValues.map(value => value / 1000);
};
