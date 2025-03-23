# API Documentation

This document outlines all the API endpoints and WebSocket connections used in the SCADA React application.

## Base URLs

- **API Base URL**: `${PUBLIC_API_URL}` (defaults to `http://localhost:8000/api`)
- **WebSocket Base URL**: `${PUBLIC_WS_URL}` (defaults to `ws://localhost:8000`)

## Authentication

### Get Authentication Token

```
POST /auth/token
```

**Request Body (x-www-form-urlencoded)**:
- `grant_type`: "password"
- `username`: string
- `password`: string
- `scope`: string (optional)

**Response**:
```json
{
  "access_token": "string",
  "token_type": "string",
  "role": "superadmin" | "admin" | "monitor" | "operator",
  "tenant_id": "string" (optional)
}
```

### Validate Token

```
GET /auth/validate/
```

**Headers**:
- `Authorization`: "Bearer {token}"

**Response**: Status 200 if valid, otherwise error

## Devices

### Get All Devices

```
GET /devices/
```

**Headers**:
- `Authorization`: "Bearer {token}"

**Response**: Array of Device objects
```json
[
  {
    "_id": "string",
    "name": "string",
    "mac": "string",
    "latitude": number,
    "longitude": number,
    "tenant_id": "string"
  }
]
```

### Create Device

```
POST /devices/
```

**Headers**:
- `Authorization`: "Bearer {token}"

**Request Body**:
```json
{
  "name": "string",
  "mac": "string",
  "latitude": number,
  "longitude": number
}
```

**Response**: Created Device object

### Update Device

```
PUT /devices/{deviceId}
```

**Headers**:
- `Authorization`: "Bearer {token}"

**Request Body**: Partial Device object

**Response**: Updated Device object

### Delete Device

```
DELETE /devices/{deviceId}
```

**Headers**:
- `Authorization`: "Bearer {token}"

**Response**: Deleted Device object

### Toggle Device Power

```
PUT /devices/toggle/{deviceId}
```

**Query Parameters**:
- `value`: boolean

**Headers**:
- `Authorization`: "Bearer {token}"

**Response**: Status 200 if successful

### Set Device Auto Mode

```
PUT /devices/auto/{deviceId}
```

**Query Parameters**:
- `value`: boolean

**Headers**:
- `Authorization`: "Bearer {token}"

**Request Body**:
```json
{
  "auto": boolean
}
```

**Response**: Status 200 if successful

### Set Device Schedule

```
PUT /devices/schedule/{deviceId}
```

**Headers**:
- `Authorization`: "Bearer {token}"

**Request Body**: Schedule object
```json
{
  "hour_on": number,
  "minute_on": number,
  "hour_off": number,
  "minute_off": number
}
```

**Response**: Status 200 if successful

### Get Energy Data

```
GET /devices/{deviceId}/energy
```

**Query Parameters**:
- `view`: "theo giờ" | "theo ngày" | "theo tuần" | "theo tháng" | "theo quý" | "theo năm"
- `start_date`: string (optional)
- `end_date`: string (optional)

**Headers**:
- `Authorization`: "Bearer {token}"

**Response**: Array of EnergyData objects
```json
[
  {
    "timestamp": "string",
    "total_energy": number
  }
]
```

## Users

### Get All Users

```
GET /users/
```

**Headers**:
- `Authorization`: "Bearer {token}"

**Response**: Array of User objects
```json
[
  {
    "user_id": number,
    "username": "string",
    "email": "string",
    "role": "string",
    "disabled": boolean
  }
]
```

### Create User

```
POST /users/
```

**Headers**:
- `Authorization`: "Bearer {token}"

**Request Body**:
```json
{
  "username": "string",
  "email": "string",
  "role": "string",
  "disabled": boolean,
  "password": "string",
  "tenant_id": "string" (optional)
}
```

**Response**: Created User object

### Update User

```
PATCH /users/{userId}
```

**Headers**:
- `Authorization`: "Bearer {token}"

**Request Body**: Partial User object

**Response**: Updated User object

### Delete User

```
DELETE /users/{userId}
```

**Headers**:
- `Authorization`: "Bearer {token}"

**Response**: Deleted User object

### Change User Password

```
PUT /users/{userId}/password
```

**Headers**:
- `Authorization`: "Bearer {token}"

**Request Body**:
```json
{
  "new_password": "string"
}
```

**Response**: Status 200 if successful

## Roles

### Get All Roles

```
GET /auth/roles
```

**Headers**:
- `Authorization`: "Bearer {token}"

**Response**: Array of Role objects
```json
[
  {
    "role_id": "string",
    "role_name": "superadmin" | "admin" | "monitor" | "operator"
  }
]
```

### Create Role

```
POST /roles/
```

**Headers**:
- `Authorization`: "Bearer {token}"

**Request Body**:
```json
{
  "name": "string",
  "permissions": ["string"]
}
```

**Response**: Created Role object

### Update Role

```
PUT /roles/{roleId}
```

**Headers**:
- `Authorization`: "Bearer {token}"

**Request Body**:
```json
{
  "name": "string",
  "permissions": ["string"]
}
```

**Response**: Updated Role object

## Audit Logs

### Get Audit Logs

```
GET /audit/
```

**Query Parameters**:
- `page`: number (default: 1)
- `page_size`: number (default: 10)

**Headers**:
- `Authorization`: "Bearer {token}"

**Response**:
```json
{
  "total": number,
  "page": number,
  "page_size": number,
  "items": [
    {
      "id": "string",
      "username": "string",
      "action": "string",
      "resource": "string",
      "timestamp": "string",
      "role": "string",
      "detail": "string" (optional)
    }
  ]
}
```

### Download Audit Logs as CSV

```
GET /audit/download
```

**Headers**:
- `Authorization`: "Bearer {token}"
- `accept`: "text/csv"
- `Content-Type`: "text/csv"

**Response**: CSV file

## Tasks

### Get Tasks

```
GET /tasks/
```

**Query Parameters**:
- `page`: number (default: 1)
- `page_size`: number (default: 10)
- `type`: string (optional)
- `status`: string (optional)

**Headers**:
- `Authorization`: "Bearer {token}"

**Response**:
```json
{
  "total": number,
  "page": number,
  "page_size": number,
  "items": [Task]
}
```

### Update Task

```
PATCH /tasks/{taskId}
```

**Headers**:
- `Authorization`: "Bearer {token}"

**Request Body**: Partial Task object

**Response**: Updated Task object

### Get Assignees

```
GET /tasks/assignees
```

**Headers**:
- `Authorization`: "Bearer {token}"

**Response**: Array of Assignee objects
```json
[
  {
    "id": number,
    "email": "string"
  }
]
```

## Firmware

### Get Latest Firmware

```
GET /firmware/latest/
```

**Headers**:
- `Authorization`: "Bearer {token}"

**Response**: FirmwareMetadata object
```json
{
  "version": "string",
  "hash_value": "string",
  "upload_time": "string"
}
```

### Upload Firmware

```
POST /firmware/upload/
```

**Query Parameters**:
- `version`: string

**Headers**:
- `Authorization`: "Bearer {token}"

**Request Body**: FormData with file

**Response**: FirmwareMetadata object

### Update Device Firmware

```
PUT /firmware/update/{deviceId}
```

**Query Parameters**:
- `version`: string

**Headers**:
- `Authorization`: "Bearer {token}"

**Response**: Status 200 if successful

### Mass Update Firmware

```
PUT /firmware/update/
```

**Headers**:
- `Authorization`: "Bearer {token}"

**Request Body**:
```json
{
  "version": "string"
}
```

**Response**: Status 200 if successful

## Alerts

### Get Alerts

```
GET /alert/
```

**Query Parameters**:
- `page`: number (default: 1)
- `page_size`: number (default: 10)

**Headers**:
- `Authorization`: "Bearer {token}"

**Response**:
```json
{
  "total": number,
  "page": number,
  "page_size": number,
  "items": [
    {
      "_id": "string",
      "device_name": "string",
      "state": "string",
      "severity": "string",
      "timestamp": "string",
      "resolve_by": "string" (optional),
      "resolved_time": "string" (optional)
    }
  ]
}
```

## WebSocket

### Monitor Device Status

```
WebSocket: /api/ws/monitor/
```

**Query Parameters**:
- `token`: string (authentication token)

**Messages Received**:

1. Device Status Update:
```json
{
  "_id": "string",
  "name": "string",
  "toggle": boolean,
  "auto": boolean,
  "hour_on": number,
  "hour_off": number,
  "minute_on": number,
  "minute_off": number,
  "state": "string"
}
```

2. Device Metrics Update:
```json
{
  "device_id": "string",
  "power": number,
  "current": number,
  "voltage": number,
  "power_factor": number,
  "total_energy": number,
  "latitude": number (optional),
  "longitude": number (optional),
  "timestamp": "string"
}
```

3. Combined Device Data:
```json
{
  "_id": "string",
  "device_id": "string",
  "name": "string",
  "toggle": boolean,
  "auto": boolean,
  "hour_on": number,
  "hour_off": number,
  "minute_on": number,
  "minute_off": number,
  "state": "string",
  "voltage": number,
  "current": number,
  "power": number,
  "power_factor": number,
  "total_energy": number,
  "latitude": number (optional),
  "longitude": number (optional),
  "mac": "string",
  "timestamp": "string",
  "tenant_id": "string",
  "energy_meter": any (optional)
}
```

The server may send individual updates or arrays of these objects.
