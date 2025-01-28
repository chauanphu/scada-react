import React, { useEffect, useState } from "react";
import { useAPI } from "../contexts/APIProvider";
import { getRoles, createRole, updateRole, Role, Permissions } from "../lib/api";
import { Dialog } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useToast } from "../hooks/use-toast";

interface ExtendedRole extends Role {
  _id: string;
  name: string;
  permissions: string[];
}

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; permissions: string[] }) => void;
  initialData?: ExtendedRole;
}

const RoleModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: RoleModalProps) => {
  const [name, setName] = useState(initialData?.name || "");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    initialData?.permissions || []
  );
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSelectedPermissions(initialData.permissions);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, permissions: selectedPermissions });
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">
            {initialData ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Tên vai trò
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Quyền hạn
              </label>
              <div className="space-y-2">
                {Object.values(Permissions).map((permission) => (
                  <label key={permission} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                      className="mr-2"
                    />
                    <span>{permission}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
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

 


export const RolesPage = () => {
  const apiContext = useAPI();
  const { toast } = useToast();
  const [roles, setRoles] = useState<ExtendedRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<ExtendedRole | null>(null);


  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = apiContext?.token || "";
        const data = await getRoles(token);
        setRoles(data as ExtendedRole[]);
        setError(null);
      } catch (err) {
         
        setError("Không thể tải danh sách vai trò" + err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
    }, [apiContext?.token]);

  const handleCreateRole = async (data: { name: string; permissions: string[] }) => {
    try {
      const token = apiContext?.token || "";
      await createRole(token, data);
      setIsCreateModalOpen(false);
      toast({
        title: "Thành công",
        description: "Đã tạo vai trò mới",
      });
    } catch (err) {
       
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tạo vai trò mới" + err,
      });
    }
  };

  const handleUpdateRole = async (data: { name: string; permissions: string[] }) => {
    if (!editingRole) return;

    try {
      const token = apiContext?.token || "";
      await updateRole(token, editingRole._id, data);
      setEditingRole(null);
      toast({
        title: "Thành công",
        description: "Đã cập nhật vai trò",
      });
    } catch (err) {
       
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật vai trò" + err,
      });
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Quản lý vai trò</h1>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Thêm vai trò
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
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <ul className="divide-y divide-gray-200">
                {roles.map((role) => (
                  <li key={role._id} className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        {role.name}
                      </h3>
                      <Button
                        variant="outline"
                        onClick={() => setEditingRole(role)}
                      >
                        Chỉnh sửa
                      </Button>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500">
                        Quyền hạn
                      </h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {role.permissions.map((permission) => (
                          <span
                            key={permission}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {permission}
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

      {isCreateModalOpen && (
        <RoleModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateRole}
        />
      )}

      {editingRole && (
        <RoleModal
          isOpen={!!editingRole}
          onClose={() => setEditingRole(null)}
          onSubmit={handleUpdateRole}
          initialData={editingRole}
        />
      )}
    </div>
  );
};

export default RolesPage;
