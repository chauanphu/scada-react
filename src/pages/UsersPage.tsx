import React, { useEffect, useState } from "react";
import { useAPI } from "../contexts/APIProvider";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  User,
  Role,
  getRoles,
} from "../lib/api";
import { Dialog } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "../components/ui/select";
import { useToast } from "../hooks/use-toast";

interface ExtendedUser extends User {
  _id: string;
  role: Role & { name: string };
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    username: string;
    email: string;
    password?: string;
    role_id: number;
  }) => void;
  initialData?: ExtendedUser;
  roles: Role[];
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  roles,
}) => {
  const [username, setUsername] = useState(initialData?.username || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number>(
    initialData?.role.role_id ?? roles[0]?.role_id ?? 0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      username,
      email,
      role_id: roleId,
      ...(initialData ? {} : { password }),
    };
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">
            {initialData ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Tên đăng nhập</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {!initialData && (
              <div>
                <Label>Mật khẩu</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <Label>Vai trò</Label>
              <Select
                value={roleId.toString()}
                onValueChange={(value) => setRoleId(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.role_id} value={role.role_id.toString()}>
                      {role.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose} type="button">
                Hủy
              </Button>
              <Button type="submit">
                {initialData ? "Cập nhật" : "Tạo mới"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
};

export const UsersPage: React.FC = () => {
  const apiContext = useAPI();
  const { toast } = useToast();
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = apiContext?.token || "";
      const data = await getUsers(token);
      setUsers(data as ExtendedUser[]);
      setError(null);
    } catch (err) {
      setError("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = apiContext?.token || "";
      const data = await getRoles(token);
      setRoles(data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách vai trò",
      });
    }
  };

  const handleCreateUser = async (userData: Partial<User>) => {
    try {
      const token = apiContext?.token || "";
      await createUser(token, userData);
      await fetchUsers();
      setIsCreateModalOpen(false);
      toast({
        title: "Thành công",
        description: "Đã tạo người dùng mới",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tạo người dùng mới",
      });
    }
  };

  const handleUpdateUser = async (userData: Partial<User>) => {
    if (!editingUser) return;

    try {
      const token = apiContext?.token || "";
      await updateUser(token, Number(editingUser._id), userData);
      await fetchUsers();
      setEditingUser(null);
      toast({
        title: "Thành công",
        description: "Đã cập nhật người dùng",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật người dùng",
      });
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;

    try {
      const token = apiContext?.token || "";
      await deleteUser(token, id);
      await fetchUsers();
      toast({
        title: "Thành công",
        description: "Đã xóa người dùng",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa người dùng",
      });
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Thêm người dùng
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div>Đang tải...</div>
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
                              {user.disabled ? "Đã vô hiệu hóa" : "Đang hoạt động"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between">
                          <div>
                            <p className="flex items-center text-sm text-gray-500">
                              {user.email}
                            </p>
                            <p className="mt-1 flex items-center text-sm text-gray-500">
                              Vai trò: {user.role.name}
                            </p>
                          </div>
                          <div className="flex space-x-2">
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
                              onClick={() => handleDeleteUser(Number(user._id))}
                            >
                              Xóa
                            </Button>
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
