import { PUBLIC_API_URL } from "./api";

// CRUD API tenant
export interface Tenant {
  _id: string;
  name: string;
  created_date: string;
  disabled: boolean;
}

export interface CreateTenantData {
  name: string;
  disabled: boolean;
}

export interface UpdateTenantData {
  name?: string;
  disabled?: boolean;
}

export const getTenants = async (token: string): Promise<Tenant[]> => {
  const response = await fetch(`${PUBLIC_API_URL}/tenant/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch tenants.");
  }
  return response.json();
};

export const createTenant = async (token: string, data: CreateTenantData): Promise<void> => {
  const response = await fetch(`${PUBLIC_API_URL}/tenant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create tenant.");
  }
};

export const updateTenant = async (token: string, tenantId: string, data: UpdateTenantData): Promise<void> => {
  const response = await fetch(`${PUBLIC_API_URL}/tenant/${tenantId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update tenant.");
  }
};

export const deleteTenant = async (token: string, tenantId: string | number): Promise<void> => {
  const response = await fetch(`${PUBLIC_API_URL}/tenant/${tenantId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to delete tenant.");
  }
};