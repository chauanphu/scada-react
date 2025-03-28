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
import { EditableTable, CreateForm, CardView, FormField } from "../components/table";
import { useToast } from "../hooks/use-toast";

export const TenantPage: React.FC = () => {
  const { token } = useAPI();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Initial tenant form data
  const [newTenant, setNewTenant] = useState<CreateTenantData>({
    name: "",
    disabled: false,
  });

  // Form fields for the creation form
  const tenantFields: FormField<CreateTenantData>[] = [
    {
      name: "name",
      label: "Tên khách hàng",
      type: "text",
      required: true,
      placeholder: "Nhập tên khách hàng",
    },
    {
      name: "disabled",
      label: "Trạng thái",
      type: "checkbox",
      placeholder: "Khóa tài khoản",
    },
  ];

  // Table columns definition
  const columns = [
    {
      header: "Tên",
      accessor: "name" as const,
      sortable: true,
      editable: true,
    },
    {
      header: "Ngày tạo",
      accessor: "created_date" as const,
      sortable: true,
      editable: false,
      cell: (tenant: Tenant) => (
        <div>{new Date(tenant.created_date).toLocaleDateString()}</div>
      ),
    },
    {
      header: "Trạng thái",
      accessor: "disabled" as const,
      sortable: true,
      editable: true,
      cell: (tenant: Tenant) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            tenant.disabled
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {tenant.disabled ? "Khóa" : "Hoạt động"}
        </span>
      ),
      editComponent: (value: boolean, onChange: (value: boolean) => void) => (
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded text-blue-600"
          />
          <span className="text-sm">Khóa tài khoản</span>
        </label>
      ),
    },
  ];

  // Fetch tenants from API
  const fetchTenants = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getTenants(token);
      setTenants(data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu khách hàng",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

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

  // Handle create tenant
  const handleCreateTenant = async (values: CreateTenantData) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await createTenant(token, values);
      await fetchTenants();
      setCreating(false);
      setNewTenant({
        name: "",
        disabled: false,
      });
      toast({
        title: "Thành công",
        description: "Đã tạo khách hàng mới",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: "Không thể tạo khách hàng mới",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit tenant
  const handleEditTenant = async (id: string, data: Partial<UpdateTenantData>) => {
    if (!token) return;
    try {
      await updateTenant(token, id, data as UpdateTenantData);
      setTenants(
        tenants.map((tenant) =>
          tenant._id === id ? { ...tenant, ...data } : tenant
        )
      );
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin khách hàng",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin khách hàng",
        variant: "destructive",
      });
      throw err; // Rethrow to let the EditableTable know it failed
    }
  };

  // Handle delete tenant
  const handleDeleteTenant = async (id: string | number) => {
    if (!token) return;
    try {
      await deleteTenant(token, id);
      setTenants(tenants.filter((tenant) => tenant._id !== id));
      toast({
        title: "Thành công",
        description: "Đã xóa khách hàng",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: "Không thể xóa khách hàng",
        variant: "destructive",
      });
      throw err; // Rethrow to let the EditableTable know it failed
    }
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

        {creating && (
          <CreateForm
            fields={tenantFields}
            initialValues={newTenant}
            onSubmit={handleCreateTenant}
            onCancel={() => setCreating(false)}
            title="Tạo khách hàng mới"
            submitLabel="Tạo khách hàng"
            isSubmitting={isSubmitting}
          />
        )}

        {/* Responsive display - Table for desktop, Cards for mobile */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Danh sách khách hàng</h3>
            
            {/* Desktop view */}
            {!isMobileView && (
              <EditableTable
                data={tenants}
                columns={columns}
                isLoading={loading}
                keyExtractor={(tenant) => tenant._id}
                onEdit={(id, data) => handleEditTenant(id as string, data)}
                onDelete={handleDeleteTenant}
                idField="_id"
              />
            )}

            {/* Mobile view */}
            {isMobileView && (
              <CardView
                data={tenants}
                columns={columns}
                isLoading={loading}
                keyExtractor={(tenant) => tenant._id}
                onCardClick={(tenant) => {
                  // You could implement opening a modal for editing
                  // or navigate to a details page
                  console.log("Card clicked:", tenant);
                }}
                actions={(tenant) => (
                  <div className="flex space-x-2 justify-end">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Implement edit action for mobile, perhaps open a modal
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) {
                          handleDeleteTenant(tenant._id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Xóa
                    </button>
                  </div>
                )}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
