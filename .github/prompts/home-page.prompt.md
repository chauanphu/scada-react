Your goal is to create a new Home Page to control and monitor devices

The Homepage is consists of 4 components:
- `components/DeviceList.tsx`: Showing the list of devices (device name, device status)
- `components/DeviceDetails.tsx`: Showing detailed status of a device (on/off, auto/manual. voltage, current, power)
- `components/DeviceMap.tsx`: Map using OSM, showing the device location
- `components/ReportView.tsx`: Display energy and working reports 

Requirement fro `ReportView` component:
 - Total energy consumption (today, so far). For example: today's consumption is 6.43kWh, total consumpton so far is 161.32kWh
 - Area chart (with 0.8 opacity) showing the power, displayed in real-time (range for last 2 hours)
 - Bar chart displaying energy consumption, filtered by (hours, days, months)
 - Area chart and Bar chart should be created as sub-components to ensure reusability and customization.
 - Ensure the Report View is mobile-friendly. The charts are fit horizontally, stacked vertically on mobile screen.
 - Icons, or images (if not found, you can add placeholders) should be used to boost the UI visibility.
 - Real-time data is provided through `contexts/WebSocketProvider.tsx`


