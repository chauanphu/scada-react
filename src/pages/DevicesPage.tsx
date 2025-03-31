import { useState, useEffect, useCallback } from "react";
import {
  Device,
  CreateDeviceData,
  getDevices as apiGetDevices,
  createDevice as apiCreateDevice,
  deleteDevice as apiDeleteDevice,
  updateDevice as apiUpdateDevice,
  UserRole,
} from "../lib/api";
import { useAPI } from "../contexts/APIProvider";
import { EditableTable, CreateForm, CardView, FormField, EditableColumn, EditForm } from "../components/table";
import { useToast } from "../hooks/use-toast";
import { Tenant, getTenants as apiGetTenants } from "../lib/tenant.api";

export const DevicesPage: React.FC = () => {
  const { token, userRole, tenantId } = useAPI();
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [editing, setEditing] = useState(false);

  // Determine if current user is admin or superadmin
  const isSuperAdmin = userRole === UserRole.SUPERADMIN;
  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN;
  const isTenant = userRole === UserRole.SUPERADMIN || userRole === UserRole.OPERATOR;

  // Initial device form data
  const [newDevice, setNewDevice] = useState<CreateDeviceData>({
    name: "",
    mac: "",
    hour_on: 0,
    hour_off: 0,
    minute_on: 0,
    minute_off: 0,
    auto: false,
    toggle: false,
    tenant_id: isTenant ? tenantId || "" : "",
  });

  // Create a mapping of tenant IDs to tenant names for easy lookup
  const tenantMap = useCallback(() => {
    const map: { [key: string]: string } = {};
    tenants.forEach((tenant) => {
      map[tenant._id] = tenant.name;
    });
    return map;
  }, [tenants]);

  // Get tenant name from ID
  const getTenantName = useCallback((tenantId?: string) => {
    if (!tenantId) return "—";
    return tenantMap()[tenantId] || tenantId;
  }, [tenantMap]);

  // Fetch devices and tenants
  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Get devices from API
      const devicesData = await apiGetDevices(token);
      setDevices(devicesData);

      // Only fetch tenants for admin/superadmin users
      if (isSuperAdmin) {
        const tenantsData = await apiGetTenants(token);
        setTenants(tenantsData);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu thiết bị",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [token, toast, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
  // Form fields for the creation form - all required fields from spec
  const deviceFields: FormField<CreateDeviceData>[] = [
    {
      name: "name",
      label: "Tên thiết bị",
      type: "text",
      required: true,
      placeholder: "Nhập tên thiết bị",
    },
    {
      name: "mac",
      label: "Địa chỉ MAC",
      type: "text",
      required: true,
      placeholder: "Nhập địa chỉ MAC",
      disabled: !isSuperAdmin,
    },
    // {
    //   name: "hour_on",
    //   label: "Giờ bật",
    //   type: "number",
    //   required: true,
    //   min: 0,
    //   max: 23,
    //   placeholder: "0-23",
    // },
    // {
    //   name: "minute_on",
    //   label: "Phút bật",
    //   type: "number",
    //   required: true,
    //   min: 0,
    //   max: 59,
    //   placeholder: "0-59",
    // },
    // {
    //   name: "hour_off",
    //   label: "Giờ tắt",
    //   type: "number",
    //   required: true,
    //   min: 0,
    //   max: 23,
    //   placeholder: "0-23",
    // },
    // {
    //   name: "minute_off",
    //   label: "Phút tắt",
    //   type: "number",
    //   required: true,
    //   min: 0,
    //   max: 59,
    //   placeholder: "0-59",
    // },
    // {
    //   name: "auto",
    //   label: "Tự động",
    //   type: "checkbox",
    //   placeholder: "Bật chế độ tự động",
    // },
    // {
    //   name: "toggle",
    //   label: "Bật thiết bị",
    //   type: "checkbox",
    // },
  ];

  // Only show tenant selection for admin/superadmin
  if (isSuperAdmin) {
    deviceFields.push({
      name: "tenant_id",
      label: "Khách hàng",
      type: "select",
      required: true,
      options: tenants.map((tenant) => ({
        value: tenant._id,
        label: tenant.name,
      })),
    });
  }

  // Format time with leading zeros
  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Table columns definition - based on user role
  const columns: EditableColumn<Device>[] = [
    {
      header: "Tên thiết bị",
      accessor: "name" as keyof Device,
      sortable: true,
      editable: isAdmin,
      type: "text"
    },
    {
      header: "Địa chỉ MAC",
      accessor: "mac" as keyof Device,
      sortable: true,
      editable: isSuperAdmin,
      type: "text",
    },
    {
      header: "Giờ bật",
      accessor: (device) => formatTime(device.hour_on ?? 0, device.minute_on ?? 0),
      sortable: true,
      editable: false
    },
    {
      header: "Giờ tắt",
      accessor: (device) => formatTime(device.hour_off ?? 0, device.minute_off ?? 0),
      sortable: true,
      editable: false
    }
  ];

  // Only show tenant column for admin/superadmin users
  if (isSuperAdmin) {
    columns.push({
      header: "Khách hàng",
      accessor: "tenant_id" as keyof Device,
      sortable: true,
      editable: true,
      type: "dropdown",
      options: tenants.map((tenant) => ({
        value: tenant._id,
        label: tenant.name,
      })),
      cell: (item: Device) => getTenantName(item.tenant_id),
    });
  }

  // Device edit fields - reusing the same structure as create fields
  const deviceEditFields: FormField<Device>[] = deviceFields.map(field => ({
    ...field,
    name: field.name as keyof Device
  }));

  // Handle create device
  const handleCreateDevice = async (values: CreateDeviceData) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await apiCreateDevice(token, values);
      await fetchData();
      setCreating(false);
      setNewDevice({
        name: "",
        mac: "",
        hour_on: 0,
        hour_off: 0,
        minute_on: 0,
        minute_off: 0,
        auto: false,
        toggle: false,
        tenant_id: isTenant ? tenantId || "" : "",
      });
      toast({
        title: "Thành công",
        description: "Đã tạo thiết bị mới",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: "Không thể tạo thiết bị mới",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  // Handle edit device 
  const handleEditDevice = async (id: string, data: Partial<CreateDeviceData>) => {
    if (!token) return;
    try {
      await apiUpdateDevice(token, id, data);
      setDevices(
        devices.map((device) =>
          device._id === id ? { ...device, ...data } : device
        )
      );
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin thiết bị",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin thiết bị",
        variant: "destructive",
      });
      throw err; // Rethrow to let the EditableTable know it failed
    }
  };

  // Handle delete device
  const handleDeleteDevice = async (id: string | number) => {
    if (!token) return;
    try {
      await apiDeleteDevice(token, id.toString());
      setDevices(devices.filter((device) => device._id !== id.toString()));
      toast({
        title: "Thành công",
        description: "Đã xóa thiết bị",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: "Không thể xóa thiết bị",
        variant: "destructive",
      });
      throw err; // Rethrow to let the EditableTable know it failed
    }
  };

  // Handle edit device for mobile view
  const handleOpenEditForm = (device: Device) => {
    setSelectedDevice(device);
    setEditing(true);
  };

  const handleCloseEditForm = () => {
    setSelectedDevice(null);
    setEditing(false);
  };

  const handleSubmitEditForm = async (updatedDevice: Device) => {
    if (!selectedDevice || !token) return;

    try {
      // Extract only the fields that have changed
      const updatedFields: Partial<CreateDeviceData> = {};
      Object.keys(updatedDevice).forEach((key) => {
        const typedKey = key as keyof Device;
        if (
          selectedDevice[typedKey] !== updatedDevice[typedKey] && 
          typedKey !== '_id'
        ) {
          // Fix the type error by properly casting the value
          if (typedKey in updatedDevice) {
            updatedFields[typedKey as keyof CreateDeviceData] = 
              updatedDevice[typedKey] as any;
          }
        }
      });

      if (Object.keys(updatedFields).length > 0) {
        await handleEditDevice(selectedDevice._id, updatedFields);
      }

      setEditing(false);
      setSelectedDevice(null);
    } catch (err) {
      console.error(err);
      // Error handled in handleEditDevice
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Quản lý thiết bị</h1>
          {isSuperAdmin && (
            <button
              onClick={() => setCreating(!creating)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <span className="hidden md:inline">+ Thêm thiết bị</span>
              <span className="md:hidden">+ Thêm</span>
            </button>
          )}
        </div>

        {creating && isSuperAdmin && (
          <CreateForm
            fields={deviceFields}
            initialValues={newDevice}
            onSubmit={handleCreateDevice}
            onCancel={() => setCreating(false)}
            title="Tạo thiết bị mới"
            submitLabel="Tạo thiết bị"
            isSubmitting={isSubmitting}
          />
        )}

        {/* Responsive display - Table for desktop, Cards for mobile */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Danh sách thiết bị</h3>

            {/* Desktop view */}
            {!isMobileView && (
              <EditableTable
                data={devices}
                columns={columns}
                isLoading={loading}
                keyExtractor={(device) => device._id}
                onEdit={(id, data) => handleEditDevice(id.toString(), data)}
                onDelete={isAdmin ? handleDeleteDevice : undefined}
                idField="_id"
                editableRows={isAdmin}
                isDeletable={isSuperAdmin}
              />
            )}

            {/* Mobile view */}
            {isMobileView && (
              <CardView
                data={devices}
                columns={columns}
                isLoading={loading}
                keyExtractor={(device) => device._id}
                onCardClick={isAdmin ? handleOpenEditForm : undefined}
                actions={(device) => (
                  <div className="flex space-x-2 justify-end">
                    {isAdmin && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditForm(device);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Bạn có chắc chắn muốn xóa thiết bị này?")) {
                              handleDeleteDevice(device._id);
                            }
                          }}
                          className={`hover:text-red-800 ${
                            !isSuperAdmin ? "text-gray-400 cursor-not-allowed" : "text-red-600"
                          }`}
                          disabled={!isSuperAdmin}
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
            {editing && selectedDevice && (
              <EditForm
                title={`Chỉnh sửa thiết bị: ${selectedDevice.name}`}
                fields={deviceEditFields}
                initialValues={selectedDevice}
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