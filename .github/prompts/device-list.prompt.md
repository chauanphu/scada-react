This component show the list of devices with their statuses

# Requirement from `DeviceList` component:
- The component is displayed on the left-most column
- It shows the device's name, their status, current power
- The device state is specified in `state` attribute return from websocket.

## Status:
- "Đang lấy dữ liệu": This is when the component is first loaded and await for the data
- "Mất kết nối": This is when the device has not sent the data in long-time. It should show gray mark
- "Thiết bị hoạt động": This is when the device is on and work as expected. It should be marked with green.
- "Thiết bị tắt": This is when the device is off as expected. It should be marked with red
- For example: `{..."state": "Mất kết nối"}` 