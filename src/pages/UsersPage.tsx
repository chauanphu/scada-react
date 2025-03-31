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
import { EditableTable, CreateForm, CardView, FormField, EditForm } from "../components/table";
import { useToast } from "../hooks/use-toast";

interface ExtendedUser extends User {
  _id: string;
  role: string; // Role is now a string
  tenant?: Tenant; // Tenant is now an object
}

interface UserFormData {
  username: string;
  email: string;
  password?: string;
  role: string;
  tenant_id: string;
  disabled?: boolean;
}

export const UsersPage: React.FC = () => {
  const { token, userRole } = useAPI();
  const { toast } = useToast();
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [editing, setEditing] = useState(false);

  // Initial user form data
  const [newUser, setNewUser] = useState<UserFormData>({
    username: "",
    email: "",
    password: "",
    role: "",
    tenant_id: "",
    disabled: false,
  });

  // Form fields for the creation form
  const userFields: FormField<UserFormData>[] = [
    {
      name: "username",
      label: "Tên đăng nhập",
      type: "text",
      required: true,
      placeholder: "Nhập tên đăng nhập",
    },
    {
      name: "email",
      label: "Email",
      type: "text", // Changed from "email" to "text"
      required: true,
      placeholder: "Nhập email",
    },
    {
      name: "password",
      label: "Mật khẩu",
      type: "text", // Changed from "password" to "text"
      required: creating, // Only required for new users
      placeholder: "Nhập mật khẩu",
    },
    {
      name: "role",
      label: "Vai trò",
      type: "select",
      required: true,
      options: roles.map((role) => ({
        value: role.role_id,
        label: role.role_name,
      })),
    },
    {
      name: "tenant_id",
      label: "Khách hàng",
      type: "select",
      required: true,
      options: tenants.map((tenant) => ({
        value: tenant._id,
        label: tenant.name,
      })),
    },
    {
      name: "disabled",
      label: "Vô hiệu hóa",
      type: "checkbox",
      placeholder: "Vô hiệu hóa tài khoản",
    },
  ];

  // User edit fields - reusing the same structure but without required password
  const userEditFields: FormField<UserFormData>[] = userFields.map(field => {
    if (field.name === 'password') {
      return { ...field, required: false, placeholder: "Để trống nếu không muốn thay đổi" };
    }
    return field;
  });

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getUsers(token);
      setUsers(data as ExtendedUser[]);
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách người dùng",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getRoles(token);
      setRoles(data);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách vai trò",
      });
    }
  }, [token, toast]);

  // Fetch tenants
  const fetchTenants = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getTenants(token);
      setTenants(data);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách khách hàng",
      });
    }
  }, [token, toast]);

  // Handle window resize for responsive view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    if (userRole === "superadmin") fetchTenants();
  }, [fetchUsers, fetchRoles, fetchTenants, userRole]);

  // Handle create user
  const handleCreateUser = async (values: UserFormData) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await createUser(token, values);
      await fetchUsers();
      setCreating(false);
      setNewUser({
        username: "",
        email: "",
        password: "",
        role: "",
        tenant_id: "",
        disabled: false,
      });
      toast({
        title: "Thành công",
        description: "Đã tạo người dùng mới",
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tạo người dùng mới",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit user
  const handleEditUser = async (id: string, data: Partial<UserFormData>) => {
    if (!token) return;
    
    // Only include password if it's provided
    if (data.password === "") {
      delete data.password;
    }
    
    try {
      await updateUser(token, id, data);
      setUsers(
        users.map((user) =>
          user._id === id ? { ...user, ...data } : user
        )
      );
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin người dùng",
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật thông tin người dùng",
      });
      throw err; // Rethrow to let the calling component know it failed
    }
  };

  // Handle delete user
  const handleDeleteUser = async (id: string | number) => {
    if (!token) return;
    try {
      await deleteUser(token, id.toString());
      setUsers(users.filter((user) => user._id !== id.toString()));
      toast({
        title: "Thành công",
        description: "Đã xóa người dùng",
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa người dùng",
      });
      throw err; // Rethrow to let the calling component know it failed
    }
  };

  // Handle edit user for mobile view
  const handleOpenEditForm = (user: ExtendedUser) => {
    setSelectedUser(user);
    setEditing(true);
  };

  const handleCloseEditForm = () => {
    setSelectedUser(null);
    setEditing(false);
  };

  const handleSubmitEditForm = async (updatedUser: UserFormData) => {
    if (!selectedUser || !token) return;

    try {
      // Only include fields that have changed
      const updatedFields: Partial<UserFormData> = {};
      
      // Map selectedUser to a UserFormData object to make comparison easier
      const currentUser: UserFormData = {
        username: selectedUser.username,
        email: selectedUser.email,
        role: selectedUser.role,
        tenant_id: selectedUser.tenant?._id || "",
        disabled: selectedUser.disabled || false,
      };
      
      Object.keys(updatedUser).forEach((key) => {
        const typedKey = key as keyof UserFormData;
        // Special handling for empty password
        if (typedKey === 'password') {
          if (updatedUser[typedKey] && updatedUser[typedKey] !== "") {
            updatedFields[typedKey] = updatedUser[typedKey];
          }
        } 
        // Regular comparison for other fields
        else if (currentUser[typedKey] !== updatedUser[typedKey]) {
          updatedFields[typedKey] = updatedUser[typedKey] as any;
        }
      });

      if (Object.keys(updatedFields).length > 0) {
        await handleEditUser(selectedUser._id, updatedFields);
      }

      setEditing(false);
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      // Error handled in handleEditUser
    }
  };

  // Table columns definition
  const getTenantId = (user: ExtendedUser) => user.tenant?._id || "";
  const setTenantId = (user: Partial<ExtendedUser>, value: string) => {
    return { ...user, tenant_id: value };
  };

  const columns = [
    {
      header: "Tên đăng nhập",
      accessor: "username" as const,
      sortable: true,
      editable: true,
    },
    {
      header: "Email",
      accessor: "email" as const,
      sortable: true,
      editable: true,
    },
    ...(userRole === "superadmin" ? [{
      header: "Khách hàng",
      accessor: (user: ExtendedUser) => getTenantId(user),
      sortable: true,
      editable: true,
      cell: (user: ExtendedUser) => (
        <div>{user.tenant?.name || "—"}</div>
      ),
      editComponent: (value: string, onChange: (value: string) => void) => (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">Chọn khách hàng</option>
          {tenants.map((tenant) => (
            <option key={tenant._id} value={tenant._id}>
              {tenant.name}
            </option>
          ))}
        </select>
      ),
      applyEdit: (user: Partial<ExtendedUser>, value: string) => setTenantId(user, value),
    }] : []),
    {
      header: "Vai trò",
      accessor: "role" as const,
      sortable: true,
      editable: true,
      cell: (user: ExtendedUser) => {
        const roleObj = roles.find(r => r.role_id === user.role);
        return <div>{roleObj?.role_name || user.role}</div>;
      },
      editComponent: (value: string, onChange: (value: string) => void) => (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">Chọn vai trò</option>
          {roles.map((role) => (
            <option key={role.role_id} value={role.role_id}>
              {role.role_name}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Trạng thái",
      accessor: "disabled" as const,
      sortable: true,
      editable: true,
      cell: (user: ExtendedUser) => (
        <div>{user.disabled ? "Vô hiệu hóa" : "Hoạt động"}</div>
      ),
      editComponent: (value: boolean, onChange: (value: boolean) => void) => (
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Quản lý người dùng</h1>
          {userRole === "admin" || userRole === "superadmin" ? (
            <button
              onClick={() => setCreating(!creating)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <span className="hidden md:inline">+ Thêm người dùng</span>
              <span className="md:hidden">+ Thêm</span>
            </button>
          ) : null}
        </div>

        {creating && (userRole === "admin" || userRole === "superadmin") && (
          <CreateForm
            fields={userFields}
            initialValues={newUser}
            onSubmit={handleCreateUser}
            onCancel={() => setCreating(false)}
            title="Tạo người dùng mới"
            submitLabel="Tạo người dùng"
            isSubmitting={isSubmitting}
          />
        )}

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Danh sách người dùng</h3>

            {/* Desktop view */}
            {!isMobileView && (
              <EditableTable
                data={users}
                columns={columns}
                isLoading={loading}
                keyExtractor={(user) => user._id}
                onEdit={(id, data) => handleEditUser(id.toString(), data)}
                onDelete={
                  userRole === "admin" || userRole === "superadmin"
                    ? handleDeleteUser
                    : undefined
                }
                idField="_id"
                editableRows={userRole === "admin" || userRole === "superadmin"}
              />
            )}

            {/* Mobile view */}
            {isMobileView && (
              <CardView
                data={users}
                columns={columns}
                isLoading={loading}
                keyExtractor={(user) => user._id}
                onCardClick={
                  userRole === "admin" || userRole === "superadmin"
                    ? handleOpenEditForm
                    : undefined
                }
                actions={(user) => (
                  <div className="flex space-x-2 justify-end">
                    {(userRole === "admin" || userRole === "superadmin") && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditForm(user);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                "Bạn có chắc chắn muốn xóa người dùng này?"
                              )
                            ) {
                              handleDeleteUser(user._id);
                            }
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Xóa
                        </button>
                      </>
                    )}
                  </div>
                )}
              />
            )}

            {/* Edit Form Modal for mobile view */}
            {editing && selectedUser && (
              <EditForm
                title={`Chỉnh sửa người dùng: ${selectedUser.username}`}
                fields={userEditFields}
                initialValues={{
                  username: selectedUser.username,
                  email: selectedUser.email,
                  password: "",
                  role: selectedUser.role,
                  tenant_id: selectedUser.tenant?._id || "",
                  disabled: selectedUser.disabled || false,
                }}
                onSubmit={handleSubmitEditForm}
                onCancel={handleCloseEditForm}
                isSubmitting={isSubmitting}
                submitLabel="Cập nhật"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
