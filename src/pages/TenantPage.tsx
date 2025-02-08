import { useState, useEffect, useCallback } from "react";
import {
  Tenant,
  CreateTenantData,
  UpdateTenantData,
  getTenants,
  createTenant,
  updateTenant,
  deleteTenant,
} from "../lib/tenant.api";
import { useAPI } from "../contexts/APIProvider";

export const TenantPage: React.FC = () => {
  const { token } = useAPI();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<UpdateTenantData>({
    name: "",
    disabled: false,
  });

  const [newTenant, setNewTenant] = useState<CreateTenantData>({
    name: "",
    disabled: false,
  });

  const fetchTenants = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await getTenants(token);
      setTenants(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load tenants.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleCreateTenant = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      await createTenant(token, newTenant);
      await fetchTenants();
      setCreating(false);
      setNewTenant({
        name: "",
        disabled: false,
      });
    } catch (err) {
      console.error(err);
      setError("Failed to create tenant.");
    } finally {
      setLoading(false);
    }
  };
  // Add handleEditTenant function
  const handleEditTenant = async (tenantId: string) => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      await updateTenant(token, tenantId, editData);
      setTenants(
        tenants.map((tenant) =>
          tenant._id === tenantId ? { ...tenant, ...editData } : tenant
        )
      );
      setEditingId(null);
    } catch (err) {
      console.error(err);
      setError("Failed to update tenant.");
    } finally {
      setLoading(false);
    }
  };
  const handleConfirmDelete = () => {
    return window.confirm("Are you sure you want to delete this tenant?");
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!handleConfirmDelete()) return;

    setLoading(true);
    setError("");
    try {
      await deleteTenant(token || "", tenantId);
      setTenants(tenants.filter((tenant) => tenant._id !== tenantId));
    } catch (err) {
      console.error(err);
      setError("Failed to delete tenant.");
    } finally {
      setLoading(false);
    }
  };

  // Update the table row rendering
  const TenantRow: React.FC<{ tenant: Tenant }> = ({ tenant }) => {
    const isEditing = editingId === tenant._id;

    return (
      <tr key={tenant._id}>
        <td className="px-4 py-4">
          {isEditing ? (
            <input
              type="text"
              value={editData.name}
              onChange={(e) =>
                setEditData({ ...editData, name: e.target.value })
              }
              className="w-full p-1 border rounded"
            />
          ) : (
            <div className="font-medium">{tenant.name}</div>
          )}
        </td>
        <td className="px-4 py-4">
          {new Date(tenant.created_date).toLocaleDateString()}
        </td>
        <td className="px-4 py-4">
          {isEditing ? (
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={editData.disabled}
                onChange={(e) =>
                  setEditData({ ...editData, disabled: e.target.checked })
                }
                className="rounded text-blue-600"
              />
              <span className="text-sm">Khóa tài khoản</span>
            </label>
          ) : (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                tenant.disabled
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {tenant.disabled ? "Disabled" : "Active"}
            </span>
          )}
        </td>
        <td className="px-4 py-4 flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={() => handleEditTenant(tenant._id)}
                className="text-green-600 hover:text-green-800"
                disabled={loading || !editData.name}
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Lưu thay đổi"
                )}
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setEditData({ name: "", disabled: false });
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                Hủy bỏ
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditingId(tenant._id);
                  setEditData({
                    name: tenant.name,
                    disabled: tenant.disabled,
                  });
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Chỉnh sửa
              </button>
              <button
                onClick={() => handleDeleteTenant(tenant._id)}
                className="text-red-600 hover:text-red-800"
              >
                Xóa
              </button>
            </>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Quản lý khách hàng</h1>
          <button
            onClick={() => setCreating(!creating)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <span className="hidden md:inline">+ Thêm khách hàng</span>
            <span className="md:hidden">+ Thêm</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {creating && (
          <div className="bg-white shadow-lg rounded-xl mb-6 p-4 md:p-6">
            <h2 className="text-xl font-semibold mb-4">Tạo khách hàng mới</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên khách hàng *
                </label>
                <input
                  type="text"
                  value={newTenant.name}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, name: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tên khách hàng"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newTenant.disabled}
                    onChange={(e) =>
                      setNewTenant({ ...newTenant, disabled: e.target.checked })
                    }
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm">Khóa tài khoản</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse md:flex-row gap-3 md:justify-end">
              <button
                onClick={() => setCreating(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTenant}
                disabled={!newTenant.name || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Create Tenant"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tenant Table */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-semibold">Danh sách khách hàng</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : tenants.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Không tìm thấy khách hàng
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
                        Ngày tạo
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
                    {tenants.map((tenant) => (
                      <TenantRow key={tenant._id} tenant={tenant} />
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
