import React, { useEffect, useState, useCallback } from "react";
import { useAPI } from "../contexts/APIProvider";
import {
  getUsers,
  createUser,
  deleteUser,
  updateUser,
  getRoles,
  User,
  Role,
} from "../lib/api";
import { getTenants, Tenant } from "../lib/tenant.api";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

interface ExtendedUser extends User {
  _id: string;
  role: string; // Role is now a string
  tenant?: Tenant; // Tenant is now an object
}

export const UsersPage: React.FC = () => {
  const apiContext = useAPI();
  const { toast } = useToast();
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
    tenant_id: "",
  });

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!apiContext?.token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers(apiContext.token);
      setUsers(data as ExtendedUser[]);
    } catch (err) {
      setError("Không thể tải danh sách người dùng, " + err);
    } finally {
      setLoading(false);
    }
  }, [apiContext?.token]);

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    if (!apiContext?.token) return;
    try {
      const data = await getRoles(apiContext.token);
      setRoles(data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: `Không thể tải danh sách vai trò ${err}`,
      });
    }
  }, [apiContext?.token, toast]);

  // Fetch tenants
  const fetchTenants = useCallback(async () => {
    if (!apiContext?.token) return;
    try {
      const data = await getTenants(apiContext.token);
      setTenants(data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: `Không thể tải danh sách khách hàng ${err}`,
      });
    }
  }, [apiContext?.token, toast]);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    if (apiContext?.userRole === "superadmin") fetchTenants();
  }, [fetchUsers, fetchRoles, fetchTenants]);

  // Handle create user
  const handleCreateUser = async () => {
    if (!apiContext?.token) return;
    if (
      !newUser.username ||
      !newUser.email ||
      !newUser.password ||
      !newUser.role ||
      !newUser.tenant_id
    ) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
      });
      return;
    }

    setLoading(true);
    try {
      await createUser(apiContext.token, newUser);
      await fetchUsers();
      setCreating(false);
      setNewUser({
        username: "",
        email: "",
        password: "",
        role: "",
        tenant_id: "",
      });
      toast({ title: "Thành công", description: "Đã tạo người dùng mới" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tạo người dùng mới",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit user
  const handleEditUser = async () => {
    if (!apiContext?.token || !editingUser) return;
    if (
      !editingUser.username ||
      !editingUser.email ||
      !editingUser.role ||
      !editingUser.tenant ||
      !editingUser.tenant._id
    ) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
      });
      return;
    }

    setLoading(true);
    try {
      await updateUser(apiContext.token, editingUser._id, {
        username: editingUser.username,
        email: editingUser.email,
        role: editingUser.role,
        disabled: editingUser.disabled || false, // Ensure disabled is included
        tenant_id: editingUser.tenant._id,
      });
      await fetchUsers();
      setEditingUser(null);
      toast({ title: "Thành công", description: "Đã cập nhật người dùng" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật người dùng",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
    try {
      await deleteUser(apiContext?.token || "", id);
      await fetchUsers();
      toast({ title: "Thành công", description: "Đã xóa người dùng" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: `Không thể xóa người dùng ${err}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Quản lý người dùng</h1>
          <Button
            onClick={() => setCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Thêm người dùng
          </Button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {creating && (
          <div className="bg-white shadow-lg rounded-xl mb-6 p-4 md:p-6">
            <h2 className="text-xl font-semibold mb-4">Thêm người dùng mới</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Tên đăng nhập *"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email *"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Mật khẩu *"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn vai trò *</option>
                {roles.map((role: Role) => (
                  <option key={role.role_id} value={role.role_id}>
                    {role.role_name}
                  </option>
                ))}
              </select>
              <select
                value={newUser.tenant_id}
                onChange={(e) =>
                  setNewUser({ ...newUser, tenant_id: e.target.value })
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn khách hàng *</option>
                {tenants.map((tenant) => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCreating(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleCreateUser}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {loading ? "Đang tạo..." : "Tạo"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {editingUser && (
          <div className="bg-white shadow-lg rounded-xl mb-6 p-4 md:p-6">
            <h2 className="text-xl font-semibold mb-4">Chỉnh sửa người dùng</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Tên đăng nhập *"
                value={editingUser.username}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, username: e.target.value })
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email *"
                value={editingUser.email}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, email: e.target.value })
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, role: e.target.value })
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn vai trò *</option>
                {roles.map((role: Role) => (
                  <option key={role.role_id} value={role.role_name}>
                    {role.role_name}
                  </option>
                ))}
              </select>
              {(editingUser.tenant) && (
                <select
                  value={editingUser.tenant._id}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      tenant: tenants.find(
                        (tenant) => tenant._id === e.target.value
                      ) || undefined,
                    })
                  }
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn khách hàng *</option>
                  {tenants.map((tenant) => (
                    <option key={tenant._id} value={tenant._id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              )}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editingUser.disabled || false}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      disabled: e.target.checked,
                    })
                  }
                  className="rounded text-blue-600"
                />
                <span className="text-sm">Vô hiệu hóa</span>
              </label>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleEditUser}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {loading ? "Đang cập nhật..." : "Cập nhật"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* User Table */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-semibold">Danh sách người dùng</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Chưa có người dùng nào
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Tên
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Vai trò
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="px-4 py-4">
                          <div className="font-medium">{user.username}</div>
                        </td>
                        <td className="px-4 py-4">{user.email}</td>
                        <td className="px-4 py-4">{user.role}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.disabled
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.disabled ? "Vô hiệu hóa" : "Hoạt động"}
                          </span>
                        </td>
                        <td className="px-4 py-4 flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                          >
                            Chỉnh sửa
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            Xóa
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
