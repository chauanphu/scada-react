// app/lib/api.ts
// Adjusted to ensure API_URL is securely accessed on the server side.

import { PermissionEnum } from "../components/NavBar";
import { Cluster, ClusterFull, CreateClusterData, Schedule } from "../types/Cluster";
import { EnergyData } from "../types/Report";
import { Task } from "../types/Task";

// export const NEXT_PUBLIC_API_URL = process.env["NEXT_PUBLIC_API_UR"];
// export const NEXT_PUBLIC_WS_URL = process.env["NEXT_PUBLIC_WS_URL"];
export const NEXT_PUBLIC_API_URL = import.meta.env.VITE_API_URL;;
export const NEXT_PUBLIC_WS_URL = import.meta.env.VITE_WS_URL;;

export type Role = {
  role_id: number;
  role_name: string;
}

export type User = {
  user_id: number;
  username: string;
  email: string;
  role: Role;
  password: string;
}

// Check if logged in
export async function checkLogin(token: string): Promise<boolean> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/auth/`, {
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
}

export async function getToken(username: string, password: string): Promise<string> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/auth/token`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username,
      password,
      scope: '',
      client_id: 'string',
      client_secret: 'string',
    }).toString(),
  });

  if (response.status === 401) {
    throw new Error('Mật khẩu hoặc tài khoản không đúng. Vui lòng thử lại.');
  }

  if (!response.ok) {
    throw new Error('Invalid credentials');
  }

  const data = await response.json();
  const token = data.access_token;
  if (!token) {
    throw new Error('Invalid token: '+ token);
  }
  return data.access_token;
}

export async function getClusters(token: string): Promise<Cluster[]> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/clusters/`, {
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch clusters');
  }

  const data = await response.json();
  return data;
}

export async function getUsers(token: string): Promise<User[]> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/user/`, {
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  const data = await response.json();
  return data;
}

export async function createUser(token: string, userData: Partial<User>): Promise<User> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/user/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error('Failed to create user');
  }

  return response.json();
}

export async function updateUser(token: string, userId: number, userData: Partial<User>): Promise<User> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/user/${userId}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error('Failed to update user');
  }

  return response.json();
}

export async function deleteUser(token: string, userId: number): Promise<User> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/user/${userId}/`, {
    method: 'DELETE',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete user');
  }
  return response.json();
}

export async function getFullClusters(token: string): Promise<ClusterFull> {
  // Get token from cookie
  
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/clusters/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cluster');
  }

  return response.json();
}

export async function getPermissions(token: string): Promise<PermissionEnum[]> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/auth/role/check`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch permissions');
  }

  const data = await response.json();
  return data.permissions.map((permission: { permission_name: string }) => permission.permission_name);
}
// Create a new cluster
//Body: {name: string, units: Unit[], account_id: number}
export async function createCluster(token: string, clusterData: CreateClusterData): Promise<ClusterFull> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/clusters/`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(clusterData),
  });

  if (!response.ok) {
    throw new Error('Failed to create cluster');
  }

  return response.json();
}

export async function updateCluster(token: string, clusterId: number, clusterData: Partial<CreateClusterData>): Promise<ClusterFull> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/clusters/${clusterId}`, {
    method: 'PUT',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(clusterData),
  });

  if (!response.ok) {
    throw new Error('Failed to update cluster');
  }

  return response.json();
}

export async  function deleteCluster(token: string, clusterId: number): Promise<ClusterFull> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/clusters/${clusterId}`, {
    method: 'DELETE',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete cluster');
  }

  return response.json();
}

export enum View {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

// GET energy data
export async function getEnergyData(
  token: string, 
  unit_id: number, 
  view: View,
  start_date?: string,
  end_date?: string
): Promise<EnergyData[]> {
  try {
    const params = new URLSearchParams({ view });
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL}/status/energy/${unit_id}?${params.toString()}`, 
      {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    // Handle empty response
    if (response.status == 404) {
      return [];
    }
    if (response.status !== 200) {
      throw new Error('Failed to fetch energy data');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    // Handle the error as needed
    return [];
  }
}

export async function getRoles(token: string): Promise<Role[]> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/user/role/`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch roles');
  }

  return response.json();
}

// Get audit logs
export type AuditLog = {
  timestamp: string;
  action: string;
  email: string;
  details: string;
};

export type PaginatedAuditLogs = {
  total: number;
  page: number;
  page_size: number;
  items: AuditLog[];
};

export async function getAuditLogs(token: string, page: number = 1, page_size: number = 10): Promise<PaginatedAuditLogs> {
  try {
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/audit/?page=${page}&page_size=${page_size}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = new Error('Failed to fetch audit logs');
      error.name = 'EmptyResponseError';
      throw error;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}

export async function downloadCSVAudit(token: string): Promise<void> {
  try {
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/audit/auditlogs.csv`, {
      method: 'GET',
      headers: {
        'accept': 'text/csv',
        'Content-Type': 'text/csv',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download CSV audit logs');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auditlogs.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading CSV audit logs:', error);
    throw error;
  }
}

// command unit through /api/clusters/units/{unit_id} PATCH
export async function setCommand(
  token: string, 
  unitId: number, 
  type: 'toggle' | 'schedule' | 'auto',
  payload: boolean | Schedule): Promise<void> {
  // Check if the command is a TOGGLE or SCHEDULE
  const body = JSON.stringify({
    type,
    payload,
  });
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/clusters/units/${unitId}`, {
    method: 'PATCH',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: body,
  });

  if (!response.ok) {
    throw new Error('Failed to toggle light');
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
    params.append('type', typeFilter);
  }
  if (statusFilter) {
    params.append('status', statusFilter);
  }

  const response = await fetch(`${NEXT_PUBLIC_API_URL}/tasks/?${params.toString()}`, {
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }

  const data = await response.json();
  return data;
}

export async function updateTask(token: string, taskId: string, taskData: Partial<Task>): Promise<Task> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    throw new Error('Failed to update task');
  }

  return response.json();
}


export type Assignee = {
  id: string;
  email: string;
}

// Get assignees /api/tasks/assignees
export async function getAssignees(token: string): Promise<Assignee[]> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/tasks/assignees`, {
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch assignees');
  }

  return response.json();
}

export async function changePassword(token: string, targetId: number, newPassword: string): Promise<void> {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/user/change-password/${targetId}`, {
    method: 'PUT',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ new_password: newPassword }),
  });

  if (!response.ok) {
    throw new Error('Failed to change password');
  }
}