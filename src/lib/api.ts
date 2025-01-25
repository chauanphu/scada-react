// app/lib/api.ts
// Adjusted to ensure API_URL is securely accessed on the server side.

import type { Device, DeviceStatus, Schedule, CreateDeviceData } from "../types/Cluster";
import { EnergyData } from "../types/Report";
import { Task } from "../types/Task";
import Cookies from "js-cookie";

// Ensure environment variables are properly loaded
export const NEXT_PUBLIC_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const NEXT_PUBLIC_WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";

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
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/users/`, {
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return Array.isArray(data); // Return true if we got users array back
  } catch (error) {
    return false;
  }
}

export async function getToken(username: string, password: string): Promise<TokenResponse> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/auth/token`, {
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
    throw new Error("Invalid credentials");
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("Invalid token response");
  }
  return data;
}

// Get all devices
export async function getDevices(token: string): Promise<Device[]> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/devices/`, {
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch devices");
  }

  const data = await response.json();
  return data;
}

export async function getUsers(token: string): Promise<User[]> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/users/`, {
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  const data = await response.json();
  return data;
}

export async function createUser(
  token: string,
  userData: Partial<User>
): Promise<User> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/users/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error("Failed to create user");
  }

  return response.json();
}

export async function updateUser(
  token: string,
  userId: number,
  userData: Partial<User>
): Promise<User> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error("Failed to update user");
  }

  return response.json();
}

export async function deleteUser(token: string, userId: number): Promise<User> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/users/${userId}`, {
    method: "DELETE",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete user");
  }
  return response.json();
}

// Create a new device
export async function createDevice(
  token: string,
  deviceData: CreateDeviceData
): Promise<Device> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/devices/`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(deviceData),
  });

  if (!response.ok) {
    throw new Error("Failed to create device");
  }

  return response.json();
}

// Update a device
export async function updateDevice(
  token: string,
  deviceId: string,
  deviceData: Partial<CreateDeviceData>
): Promise<Device> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/devices/${deviceId}`, {
    method: "PUT",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(deviceData),
  });

  if (!response.ok) {
    throw new Error("Failed to update device");
  }

  return response.json();
}

// Delete a device
export async function deleteDevice(
  token: string,
  deviceId: string
): Promise<Device> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/devices/${deviceId}`, {
    method: "DELETE",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete device");
  }

  return response.json();
}

// Control device
export async function setCommand(
  token: string,
  deviceId: string,
  type: "toggle" | "schedule" | "auto",
  payload: boolean | Schedule
): Promise<void> {
  const body = JSON.stringify({
    type,
    payload,
  });
  const response = await fetch(
    `${NEXT_PUBLIC_API_URL}/devices/${deviceId}/control`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to control device");
  }
}

export enum View {
  HOURLY = "hourly",
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  YEARLY = "yearly",
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
      `${NEXT_PUBLIC_API_URL}/devices/${deviceId}/energy?${params.toString()}`,
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
      throw new Error("Failed to fetch energy data");
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

export async function getRoles(token: string): Promise<Role[]> {
  try {
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/auth/roles`, {
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
      throw new Error("Failed to fetch roles");
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
      `${NEXT_PUBLIC_API_URL}/audit/?page=${page}&page_size=${page_size}`,
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
      const error = new Error("Failed to fetch audit logs");
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
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/audit/download`, {
      method: "GET",
      headers: {
        accept: "text/csv",
        "Content-Type": "text/csv",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to download CSV audit logs");
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
    `${NEXT_PUBLIC_API_URL}/tasks/?${params.toString()}`,
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }

  const data = await response.json();
  return data;
}

export async function updateTask(
  token: string,
  taskId: string,
  taskData: Partial<Task>
): Promise<Task> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    throw new Error("Failed to update task");
  }

  return response.json();
}

export type Assignee = {
  id: number;
  email: string;
};

// Get assignees /api/tasks/assignees
export async function getAssignees(token: string): Promise<Assignee[]> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/tasks/assignees`, {
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch assignees");
  }

  return response.json();
}

export async function changePassword(
  token: string,
  targetId: number,
  newPassword: string
): Promise<void> {
  const response = await fetch(
    `${NEXT_PUBLIC_API_URL}/users/${targetId}/password`,
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
    throw new Error("Failed to change password");
  }
}

export const Permissions = {
  VIEW_DEVICES: "view_devices",
  CONTROL_DEVICES: "control_devices",
  MANAGE_DEVICES: "manage_devices",
  VIEW_USERS: "view_users",
  MANAGE_USERS: "manage_users",
  VIEW_ROLES: "view_roles",
  MANAGE_ROLES: "manage_roles",
  VIEW_AUDIT: "view_audit",
  VIEW_ENERGY: "view_energy",
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];
