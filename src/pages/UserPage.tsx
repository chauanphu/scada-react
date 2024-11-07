"use client";

import { useEffect, useState, Fragment } from "react";
import { Dialog, Transition, TransitionChild } from "@headlessui/react";
import { createUser, deleteUser, getRoles, getUsers, Role, updateUser, changePassword } from "../lib/api";
import Cookies from 'js-cookie';
import { useAPI } from "../contexts/APIProvider";
import { Navbar } from "../components/NavBar";

// Kiểu dữ liệu cho User nhận từ máy chủ
type User = {
  user_id: number;
  username: string;
  email: string;
  role: {
    role_id: number;
    role_name: string;
  };
};

// Kiểu dữ liệu cho biểu mẫu tạo người dùng, bao gồm confirmPassword
type CreateUserForm = {
  username: string;
  email: string;
  role: {
    role_id: number;
    role_name: string;
  } | null;
  password: string;
  confirmPassword: string;
};

// Kiểu dữ liệu cho yêu cầu tạo người dùng gửi đến máy chủ
type CreateUserRequest = {
  username: string;
  email: string;
  role: {
    role_id: number;
    role_name: string;
  };
  password: string;
};

// Kiểu dữ liệu cho biểu mẫu thay đổi mật khẩu
type ChangePasswordForm = {
  newPassword: string;
  confirmPassword: string;
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [newUser, setNewUser] = useState<CreateUserForm>({
    username: "",
    email: "",
    role: null,
    password: "",
    confirmPassword: "",
  });
  const apiContext = useAPI();
  const permissions = apiContext?.permissions || [];
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>({
    newPassword: "",
    confirmPassword: "",
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Lấy tất cả người dùng
  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const token = Cookies.get('token') || '';
      const data = await getUsers(token);
      setUsers(data);
    } catch (err: any) { //eslint-disable-line ..typescript-eslint/no-explicit-any
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Lấy tất cả vai trò
  const fetchRoles = async () => {
    setLoading(true);
    setError("");
    try {
      // Lấy token từ cookie
      const token = Cookies.get('token') || '';
      const rolesData = await getRoles(token);
      setRoles(rolesData);
    } catch (err: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(err);
      setError("Không lấy được vai trò.");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý tạo người dùng mới
  const handleCreateUser = async () => {
    // Kiểm tra hợp lệ phía khách hàng
    if (
      !newUser.username ||
      !newUser.email ||
      !newUser.role ||
      !newUser.password ||
      !newUser.confirmPassword
    ) {
      setError("Vui lòng điền đầy đủ các trường.");
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      setError("Mật khẩu không khớp.");
      return;
    }
    
    if (newUser.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    // Tùy chọn, thêm kiểm tra hợp lệ khác (ví dụ: định dạng email, độ mạnh mật khẩu)

    setLoading(true);
    setError("");
    try {
      // Chuẩn bị payload bằng cách loại bỏ confirmPassword
      const { username, email, role, password } = newUser;
      const payload: CreateUserRequest = { username, email, role, password };

      const token = Cookies.get('token') || '';
      const createdUser: User = await createUser(token, payload);

      setUsers([...users, createdUser]);
      setNewUser({
        username: "",
        email: "",
        role: null,
        password: "",
        confirmPassword: "",
      });
      setIsModalOpen(false); // Đóng modal khi thành công
        } catch (err: any) { //eslint-disable-line @typescript-eslint/no-explicit-any

      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý cập nhật người dùng
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (!editingUser.username || !editingUser.email || !editingUser.role) {
      setError("Vui lòng điền đầy đủ các trường cho người dùng.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = Cookies.get('token') || '';
      const updatedUser = await updateUser(token, editingUser.user_id, editingUser);
      setUsers(
        users.map((user) => (user.user_id === updatedUser.user_id ? updatedUser : user))
      );
      setEditingUser(null);
    } catch (err: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xóa người dùng
  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;

    setLoading(true);
    setError("");
    try {
      const token = Cookies.get('token') || '';
      await deleteUser(token, userId);
      setUsers(users.filter((user) => user.user_id !== userId));
    } catch (err: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi mật khẩu
  const handleChangePassword = async () => {
    if (!targetUserId) return;

    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError("Vui lòng điền đầy đủ các trường.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Mật khẩu không khớp.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = Cookies.get('token') || '';
      await changePassword(token, targetUserId, passwordForm.newPassword);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      setIsPasswordModalOpen(false);
    } catch (err: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar permissions={permissions} />

      <div className="min-h-screen bg-gray-100 p-4">
        
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Quản Lý Người Dùng</h1>

          {/* Trạng thái lỗi */}
          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
              role="alert"
            >
              <strong className="font-bold">Lỗi:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {/* Nút Tạo Người Dùng Mới */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Tạo Người Dùng Mới
            </button>
          </div>

          {/* Modal Tạo Người Dùng */}
          <Transition appear show={isModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={() => setIsModalOpen(false)}>
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-25" />
              </TransitionChild>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                      <Dialog.Title as="h3" className="text-2xl font-bold text-gray-900">
                        Tạo Người Dùng Mới
                      </Dialog.Title>
                      <div className="mt-4">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleCreateUser();
                          }}
                        >
                          {/* Tên Người Dùng */}
                          <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="username">
                              Tên Người Dùng
                            </label>
                            <input
                              type="text"
                              id="username"
                              value={newUser.username}
                              onChange={(e) =>
                                setNewUser({ ...newUser, username: e.target.value })
                              }
                              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Nhập tên người dùng"
                              required
                            />
                          </div>

                          {/* Email */}
                          <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
                              Email
                            </label>
                            <input
                              type="email"
                              id="email"
                              value={newUser.email}
                              onChange={(e) =>
                                setNewUser({ ...newUser, email: e.target.value })
                              }
                              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="nhap@example.com"
                              required
                            />
                          </div>

                          {/* Vai Trò */}
                          <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="role">
                              Vai Trò
                            </label>
                            <select
                              id="role"
                              value={newUser.role?.role_id || ""}
                              onChange={(e) =>
                                setNewUser({
                                  ...newUser,
                                  role: {
                                    role_id: Number(e.target.value),
                                    role_name: roles.find((role) => role.role_id === Number(e.target.value))?.role_name || ""
                                  }
                                })
                              }
                              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            >
                              <option value="" disabled>Chọn vai trò</option>
                              {roles.map((role) => (
                                <option key={role.role_id} value={role.role_id}>{role.role_name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Mật Khẩu */}
                          <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
                              Mật Khẩu
                            </label>
                            <input
                              type="password"
                              id="password"
                              value={newUser.password}
                              onChange={(e) =>
                                setNewUser({ ...newUser, password: e.target.value })
                              }
                              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Nhập mật khẩu"
                              required
                            />
                          </div>

                          {/* Xác Nhận Mật Khẩu */}
                          <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="confirmPassword">
                              Xác Nhận Mật Khẩu
                            </label>
                            <input
                              type="password"
                              id="confirmPassword"
                              value={newUser.confirmPassword}
                              onChange={(e) =>
                                setNewUser({ ...newUser, confirmPassword: e.target.value })
                              }
                              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Xác nhận mật khẩu"
                              required
                            />
                          </div>

                          {/* Nút Gửi */}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setIsModalOpen(false)}
                              className="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                              disabled={loading}
                            >
                              Hủy
                            </button>
                            <button
                              type="submit"
                              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={loading}
                            >
                              {loading ? "Đang tạo..." : "Tạo"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </Dialog.Panel>
                  </TransitionChild>
                </div>
              </div>
            </Dialog>
          </Transition>

          {/* Modal Thay Đổi Mật Khẩu */}
          <Transition appear show={isPasswordModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={() => setIsPasswordModalOpen(false)}>
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-25" />
              </TransitionChild>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                      <Dialog.Title as="h3" className="text-2xl font-bold text-gray-900">
                        Thay Đổi Mật Khẩu
                      </Dialog.Title>
                      <div className="mt-4">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleChangePassword();
                          }}
                        >
                          {/* Mật Khẩu Mới */}
                          <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="newPassword">
                              Mật Khẩu Mới
                            </label>
                            <input
                              type="password"
                              id="newPassword"
                              value={passwordForm.newPassword}
                              onChange={(e) =>
                                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                              }
                              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Nhập mật khẩu mới"
                              required
                            />
                          </div>

                          {/* Xác Nhận Mật Khẩu */}
                          <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="confirmPassword">
                              Xác Nhận Mật Khẩu
                            </label>
                            <input
                              type="password"
                              id="confirmPassword"
                              value={passwordForm.confirmPassword}
                              onChange={(e) =>
                                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                              }
                              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Xác nhận mật khẩu"
                              required
                            />
                          </div>

                          {/* Nút Gửi */}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setIsPasswordModalOpen(false)}
                              className="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                              disabled={loading}
                            >
                              Hủy
                            </button>
                            <button
                              type="submit"
                              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={loading}
                            >
                              {loading ? "Đang thay đổi..." : "Thay Đổi"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </Dialog.Panel>
                  </TransitionChild>
                </div>
              </div>
            </Dialog>
          </Transition>

          {/* Bảng Người Dùng */}
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Tên Người Dùng
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Vai Trò
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-100">
                    {/* Tên Người Dùng */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser?.user_id === user.user_id ? (
                        <input
                          type="text"
                          value={editingUser?.username || ""}
                          onChange={(e) =>
                            setEditingUser({
                              ...editingUser!,
                              username: e.target.value,
                            })
                          }
                          className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-700">{user.username}</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser?.user_id === user.user_id ? (
                        <input
                          type="email"
                          value={editingUser?.email || ""}
                          onChange={(e) =>
                            setEditingUser({
                              ...editingUser!,
                              email: e.target.value,
                            })
                          }
                          className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-700">{user.email}</span>
                      )}
                    </td>

                    {/* Vai Trò */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser?.user_id === user.user_id ? (
                        <select
                          value={editingUser?.role.role_id || ""}
                          onChange={(e) =>
                            setEditingUser({
                              ...editingUser!,
                              role: {
                                role_id: Number(e.target.value),
                                role_name: roles.find((role) => role.role_id === Number(e.target.value))?.role_name || ""
                              }
                            })
                          }
                          className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {roles.map((role) => (
                            <option key={role.role_id} value={role.role_id}>{role.role_name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-700">{user.role.role_name}</span>
                      )}
                    </td>

                    {/* Hành Động */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser?.user_id === user.user_id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleUpdateUser}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            disabled={loading}
                          >
                            {loading ? "Đang lưu..." : "Lưu"}
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            disabled={loading}
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.user_id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Xóa
                          </button>
                          <button
                            onClick={() => {
                              setTargetUserId(user.user_id);
                              setIsPasswordModalOpen(true);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            Đổi Mật Khẩu
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      Không có người dùng nào được tìm thấy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Trạng thái tải */}
            {loading && (
              <div className="flex justify-center items-center py-4">
                <svg
                  className="animate-spin h-8 w-8 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}