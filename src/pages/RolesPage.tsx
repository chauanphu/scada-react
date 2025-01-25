import React, { useEffect, useState } from "react";
import { useAPI } from "../contexts/APIProvider";
import { Navbar } from "../components/NavBar";
import { getRoles, Role, Permissions } from "../lib/api";

interface ExtendedRole extends Role {
  _id: string;
  name: string;
  permissions: string[];
}

export const RolesPage: React.FC = () => {
  const apiContext = useAPI();
  const [roles, setRoles] = useState<ExtendedRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const token = apiContext?.token || "";
      const data = await getRoles(token);
      setRoles(data as ExtendedRole[]);
      setError(null);
    } catch (err) {
      setError("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  const getPermissionLabel = (permission: string) => {
    return permission
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Tenants</h1>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              onClick={() => {
                // Open create role modal
              }}
            >
              Add Role
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <ul className="divide-y divide-gray-200">
                {roles.map((role) => (
                  <li key={role._id} className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        {role.name}
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => {
                            // Open edit role modal
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500">
                        Permissions
                      </h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {role.permissions.map((permission) => (
                          <span
                            key={permission}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {getPermissionLabel(permission)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 