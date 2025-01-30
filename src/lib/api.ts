// app/lib/api.ts
// Adjusted to ensure API_URL is securely accessed on the server side.

import type { Device, DeviceStatus, Schedule, CreateDeviceData } from "../types/Cluster";
import { EnergyData } from "../types/Report";
import { Task } from "../types/Task";

// Ensure environment variables are properly loaded
export const PUBLIC_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const PUBLIC_WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/api/ws";

export enum UserRole {
  SUPERADMIN = "superadmin",
  ADMIN = "admin",
  MONITOR = "monitor",
  OPERATOR = "operator",
}

export type Role = {
  role_id: number;
  role_name: UserRole;
};

export type User = {
  user_id: number;
  username: string;
  email: string;
  role: Role;
  password?: string;
  disabled?: boolean;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  role: UserRole;
  tenant_id?: string;
};

// Re-export the types
export type { Device, DeviceStatus, Schedule, CreateDeviceData };

// Check if logged in by validating token by getting user info
export async function checkLogin(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${PUBLIC_API_URL}/auth/validate/`, {
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      return false;
    }
    return true;
  } catch (error) {
    console.log(error)
    return false;
  }
}

export async function getToken(username: string, password: string): Promise<TokenResponse> {
  const response = await fetch(`${PUBLIC_API_URL}/auth/token`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "password",
      username,
      password,
      scope: "",
    }).toString(),
  });

  if (response.status === 401) {
    throw new Error("Mật khẩu hoặc tài khoản không đúng. Vui lòng thử lại.");
  }

  if (!response.ok) {
    throw new Error("Thông tin đăng nhập không hợp lệ");
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("Phản hồi token không hợp lệ");
  }
  return data;
}

// Get all devices
export async function getDevices(token: string): Promise<Device[]> {
  const response = await fetch(`${PUBLIC_API_URL}/devices/`, {
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Không thể tải danh sách thiết bị");
  }

  const data = await response.json();
  return data;
}

export async function getUsers(token: string): Promise<User[]> {
  const response = await fetch(`${PUBLIC_API_URL}/users/`, {
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Không thể tải danh sách người dùng");
  }
  const data = await response.json();
  return data;
}

export async function createUser(
  token: string,
  userData: Partial<User>
): Promise<User> {
  const response = await fetch(`${PUBLIC_API_URL}/users/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error("Không thể tạo người dùng mới");
  }

  return response.json();
}

export async function updateUser(
  token: string,
  userId: number,
  userData: Partial<User>
): Promise<User> {
  const response = await fetch(`${PUBLIC_API_URL}/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error("Không thể cập nhật người dùng");
  }

  return response.json();
}

export async function deleteUser(token: string, userId: number): Promise<User> {
  const response = await fetch(`${PUBLIC_API_URL}/users/${userId}`, {
    method: "DELETE",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Không thể xóa người dùng");
  }
  return response.json();
}

// Create a new device
export async function createDevice(
  token: string,
  deviceData: CreateDeviceData
): Promise<Device> {
  const response = await fetch(`${PUBLIC_API_URL}/devices/`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(deviceData),
  });

  if (!response.ok) {
    throw new Error("Không thể tạo thiết bị mới");
  }

  return response.json();
}

// Update a device
export async function updateDevice(
  token: string,
  deviceId: string,
  deviceData: Partial<CreateDeviceData>
): Promise<Device> {
  const response = await fetch(`${PUBLIC_API_URL}/devices/${deviceId}`, {
    method: "PUT",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(deviceData),
  });

  if (!response.ok) {
    throw new Error("Không thể cập nhật thiết bị");
  }

  return response.json();
}

// Delete a device
export async function deleteDevice(
  token: string,
  deviceId: string
): Promise<Device> {
  const response = await fetch(`${PUBLIC_API_URL}/devices/${deviceId}`, {
    method: "DELETE",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Không thể xóa thiết bị");
  }

  return response.json();
}

// Control device
// Toggle device power
export async function toggleDevice(
  token: string,
  deviceId: string,
  state: boolean
): Promise<void> {
  try {
    const response = await fetch(
      `${PUBLIC_API_URL}/devices/toggle/${deviceId}?value=${state}`,
      {
        method: "PUT",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // body: JSON.stringify({ state }), khong can thiet
      }
    );

    if (!response.ok) {
      throw new Error("Không thể thay đổi trạng thái thiết bị");
    }
  } catch (error) {
    throw new Error("Lỗi khi điều khiển thiết bị: " + (error as Error).message);
  }
}

// Set device auto mode
export async function setDeviceAuto(
  token: string,
  deviceId: string,
  auto: boolean
): Promise<void> {
  try {
    const response = await fetch(
      `${PUBLIC_API_URL}/devices/auto/${deviceId}`,
      {
        method: "PUT",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ auto }),
      }
    );

    if (!response.ok) {
      throw new Error("Không thể thay đổi chế độ tự động của thiết bị");
    }
  } catch (error) {
    throw new Error(
      "Lỗi khi thay đổi chế độ tự động: " + (error as Error).message
    );
  }
}

// Set device schedule
export async function setDeviceSchedule(
  token: string,
  deviceId: string,
  schedule: Schedule
): Promise<void> {
  try {
    const response = await fetch(
      `${PUBLIC_API_URL}/devices/schedule/${deviceId}`,
      {
        method: "PUT",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(schedule),
      }
    );

    if (!response.ok) {
      throw new Error("Không thể cập nhật lịch trình thiết bị");
    }
  } catch (error) {
    throw new Error(
      "Lỗi khi cập nhật lịch trình: " + (error as Error).message
    );
  }
}

export enum View {
  HOURLY = "theo giờ",
  DAILY = "theo ngày",
  WEEKLY = "theo tuần",
  MONTHLY = "theo tháng",
  QUARTERLY = "theo quý",
  YEARLY = "theo năm",
}

// GET energy data
export async function getEnergyData(
  token: string,
  deviceId: string,
  view: View,
  start_date?: string,
  end_date?: string
): Promise<EnergyData[]> {
  try {
    const params = new URLSearchParams({ view });
    if (start_date) params.append("start_date", start_date);
    if (end_date) params.append("end_date", end_date);
    const response = await fetch(
      `${PUBLIC_API_URL}/devices/${deviceId}/energy?${params.toString()}`,
      {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // Handle empty response
    if (response.status == 404) {
      return [];
    }
    if (response.status !== 200) {
      throw new Error("Không thể tải dữ liệu năng lượng");
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

export async function getRoles(token: string): Promise<Role[]> {
  try {
    const response = await fetch(`${PUBLIC_API_URL}/auth/roles`, {
      method: "GET",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 404) {
      // If roles endpoint is not available, return an empty array
      return [];
    }

    if (!response.ok) {
      throw new Error("Không thể tải danh sách vai trò");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching roles:", error);
    return [];
  }
}

// Get audit logs
export interface AuditLog {
  id: number;
  username: string;
  action: string;
  target: string;
  timestamp: string;
  details?: string;
}

export type PaginatedAuditLogs = {
  total: number;
  page: number;
  page_size: number;
  items: AuditLog[];
};

export async function getAuditLogs(
  token: string,
  page: number = 1,
  page_size: number = 10
): Promise<PaginatedAuditLogs> {
  try {
    const response = await fetch(
      `${PUBLIC_API_URL}/audit/?page=${page}&page_size=${page_size}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = new Error("Không thể tải nhật ký kiểm tra");
      error.name = "EmptyResponseError";
      throw error;
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }
}

export async function downloadCSVAudit(token: string): Promise<void> {
  try {
    const response = await fetch(`${PUBLIC_API_URL}/audit/download`, {
      method: "GET",
      headers: {
        accept: "text/csv",
        "Content-Type": "text/csv",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Không thể tải xuống nhật ký kiểm tra dạng CSV");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "auditlogs.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading CSV audit logs:", error);
    throw error;
  }
}

export type PaginatedTasks = {
  total: number;
  page: number;
  page_size: number;
  items: Task[];
};

export async function getTasks(
  token: string,
  page: number = 1,
  page_size: number = 10,
  typeFilter?: string,
  statusFilter?: string
): Promise<PaginatedTasks> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  });

  if (typeFilter) {
    params.append("type", typeFilter);
  }
  if (statusFilter) {
    params.append("status", statusFilter);
  }

  const response = await fetch(
    `${PUBLIC_API_URL}/tasks/?${params.toString()}`,
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Không thể tải danh sách nhiệm vụ");
  }

  const data = await response.json();
  return data;
}

export async function updateTask(
  token: string,
  taskId: string,
  taskData: Partial<Task>
): Promise<Task> {
  const response = await fetch(`${PUBLIC_API_URL}/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    throw new Error("Không thể cập nhật nhiệm vụ");
  }

  return response.json();
}

export type Assignee = {
  id: number;
  email: string;
};

// Get assignees /api/tasks/assignees
export async function getAssignees(token: string): Promise<Assignee[]> {
  const response = await fetch(`${PUBLIC_API_URL}/tasks/assignees`, {
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Không thể tải danh sách người được phân công");
  }

  return response.json();
}

export async function changePassword(
  token: string,
  targetId: number,
  newPassword: string
): Promise<void> {
  const response = await fetch(
    `${PUBLIC_API_URL}/users/${targetId}/password`,
    {
      method: "PUT",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ new_password: newPassword }),
    }
  );

  if (!response.ok) {
    throw new Error("Không thể thay đổi mật khẩu");
  }
}

export const Permissions = {
  VIEW_DEVICES: "xem_thiet_bi",
  CONTROL_DEVICES: "dieu_khien_thiet_bi",
  MANAGE_DEVICES: "quan_ly_thiet_bi",
  VIEW_USERS: "xem_nguoi_dung",
  MANAGE_USERS: "quan_ly_nguoi_dung",
  VIEW_ROLES: "xem_vai_tro",
  MANAGE_ROLES: "quan_ly_vai_tro",
  VIEW_AUDIT: "xem_nhat_ky",
  VIEW_ENERGY: "xem_nang_luong",
} as const;

// Firmware interfaces
export interface FirmwareMetadata {
  version: string;
  filename: string;
  upload_date: string;
}

// Get latest firmware version
export async function getLatestFirmware(token: string): Promise<FirmwareMetadata> {
  const response = await fetch(`${PUBLIC_API_URL}/firmware/latest/`, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    if (!response.ok) {
      throw new Error("Không thể tải phiên bản firmware mới nhất");
    }

    return response.json();
  } catch (error) {
    throw new Error("Lỗi khi tải phiên bản firmware: " + (error as Error).message);
  }
}

// Upload new firmware
export async function uploadFirmware(
  token: string,
  version: string,
  file: File
): Promise<FirmwareMetadata> {
  const formData = new FormData();
  formData.append("version", version);
  formData.append("file", file);

  const response = await fetch(`${PUBLIC_API_URL}/firmware/upload/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  try {
    if (!response.ok) {
      throw new Error("Không thể tải lên firmware mới");
    }

    return response.json();
  } catch (error) {
    throw new Error("Lỗi khi tải lên firmware: " + (error as Error).message);
  }
}

// Update firmware for a specific device
export async function updateDeviceFirmware(
  token: string,
  deviceId: string,
  version: string
): Promise<void> {
  const response = await fetch(
    `${PUBLIC_API_URL}/firmware/update/${deviceId}?version=${version}`,
    {
      method: "PUT",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  try {
    if (!response.ok) {
      throw new Error("Không thể cập nhật firmware cho thiết bị");
    }
  } catch (error) {
    throw new Error("Lỗi khi cập nhật firmware thiết bị: " + (error as Error).message);
  }
}

// Mass update firmware for multiple devices
export async function massUpdateFirmware(
  token: string,
  version: string
): Promise<void> {
  const response = await fetch(`${PUBLIC_API_URL}/firmware/update/`, {
    method: "PUT",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ version }),
  });

  try {
    if (!response.ok) {
      throw new Error("Không thể cập nhật hàng loạt firmware");
    }
  } catch (error) {
    throw new Error("Lỗi khi cập nhật hàng loạt firmware: " + (error as Error).message);
  }
}

export type Permission = typeof Permissions[keyof typeof Permissions];

export async function createRole(
  token: string,
  data: { name: string; permissions: string[] }
): Promise<Role> {
  const response = await fetch(`${PUBLIC_API_URL}/roles/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Không thể tạo vai trò mới");
  }

  return response.json();
}

export async function updateRole(
  token: string,
  roleId: string,
  data: { name: string; permissions: string[] }
): Promise<Role> {
  const response = await fetch(`${PUBLIC_API_URL}/roles/${roleId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Không thể cập nhật vai trò");
  }

  return response.json();
}
