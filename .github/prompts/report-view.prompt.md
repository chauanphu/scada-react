This component displays energy and working reports of each devices

# Requirement from `ReportView` component:
 - Total energy consumption (today, so far). For example: today's consumption is 6.43kWh, total consumpton so far is 161.32kWh
 - Area chart (with 0.8 opacity) showing the power, displayed in real-time (range for last 2 hours)
 - Bar chart displaying energy consumption, filtered by (hours, days, months)
 - Area chart and Bar chart should be created as sub-components to ensure reusability and customization.
 - Ensure the Report View is mobile-friendly. The charts are fit horizontally, stacked vertically on mobile screen.
 - Icons, or images (if not found, you can add placeholders) should be used to boost the UI visibility.
 - Real-time data is provided through `contexts/WebSocketProvider.tsx`

# APIs:

## HTTPS

### Get Energy Data

```
GET /api/report
```

**Query Parameters**:
- `device_id`: string
- `aggregation`: "hourly" | "daily" | "monthly"
- `start_date`: string (optional). For example: start_date=2023-07-01T00:00:00Z
- `end_date`: string (optional). For example: end_date=2023-12-31T23:59:59Z

**Headers**:
- `Authorization`: "Bearer {token}"

**Response**: Array of EnergyData objects
```json
[
  {
    "timestamp": "string",
    "total_energy": number // Energy consumption (Wh)
  }
]
```

## Websocket