import React, { useEffect, useState } from "react";
import { useAPI } from "../contexts/APIProvider";
import { Navbar } from "../components/NavBar";
import { getUsers, createUser, updateUser, deleteUser, User, Role } from "../lib/api";

interface ExtendedUser extends User {
  _id: string;
  role: Role & { name: string };
}

export const UsersPage: React.FC = () => {
  const apiContext = useAPI();
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = apiContext?.token || "";
      const data = await getUsers(token);
      setUsers(data as ExtendedUser[]);
      setError(null);
    } catch (err) {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: Partial<User>) => {
    try {
      const token = apiContext?.token || "";
      await createUser(token, userData);
      await fetchUsers();
      setError(null);
    } catch (err) {
      setError("Failed to create user");
    }
  };

  const handleUpdateUser = async (id: number, userData: Partial<User>) => {
    try {
      const token = apiContext?.token || "";
      await updateUser(token, id, userData);
      await fetchUsers();
      setError(null);
    } catch (err) {
      setError("Failed to update user");
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      const token = apiContext?.token || "";
      await deleteUser(token, id);
      await fetchUsers();
      setError(null);
    } catch (err) {
      setError("Failed to delete user");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Users</h1>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              onClick={() => {
                // Open create user modal
              }}
            >
              Add User
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
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {users.map((user) => (
                  <li key={user._id}>
                    <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {user.username}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.disabled
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {user.disabled ? "Disabled" : "Active"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between">
                          <div>
                            <p className="flex items-center text-sm text-gray-500">
                              {user.email}
                            </p>
                            <p className="mt-1 flex items-center text-sm text-gray-500">
                              Role: {user.role.name}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              className="text-indigo-600 hover:text-indigo-900"
                              onClick={() => {
                                // Open edit user modal
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDeleteUser(Number(user._id))}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
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