import { useState, useEffect, useCallback } from "react";
import { Device, CreateDeviceData } from "../lib/api";
import { useAPI } from "../contexts/APIProvider";
import { getDevices, createDevice, deleteDevice } from "../lib/api";

export const DevicesPage: React.FC = () => {
  const apiContext = useAPI();
  const { token } = useAPI();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [newDevice, setNewDevice] = useState<CreateDeviceData>({
    name: "",
    mac: "",
    hour_on: 0,
    hour_off: 0,
    minute_on: 0,
    minute_off: 0,
    auto: false,
    toggle: false,
    tenant_id: "",
  });

  const fetchDevices = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await getDevices(token);
      setDevices(data);
    } catch (err) {
      console.error(err);
      setError("Lỗi khi tải danh sách thiết bị.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleCreateDevice = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      await createDevice(token, newDevice);
      await fetchDevices();
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
        tenant_id: "",
      });
    } catch (err) {
      console.error(err);
      setError("Lỗi khi tạo thiết bị mới.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = () => {
    return window.confirm("Bạn có chắc chắn muốn xóa thiết bị này?");
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!handleConfirmDelete()) return;

    setLoading(true);
    setError("");
    try {
      const token = apiContext?.token || "";
      await deleteDevice(token, deviceId);
      setDevices(devices.filter((device) => device._id !== deviceId));
    } catch (err) {
      console.error(err);
      setError("Lỗi khi xóa thiết bị.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Quản Lý Thiết Bị</h1>
          <button
            onClick={() => setCreating(!creating)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <span className="hidden md:inline">+ Thêm Thiết Bị</span>
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
            <h2 className="text-xl font-semibold mb-4">Thêm thiết bị mới</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên thiết bị *
                </label>
                <input
                  type="text"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: Đèn chiếu sáng 01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ MAC *
                </label>
                <input
                  type="text"
                  value={newDevice.mac}
                  onChange={(e) => setNewDevice({ ...newDevice, mac: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: 00:1A:2B:3C:4D:5E"
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian bật
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={newDevice.hour_on}
                      onChange={(e) => setNewDevice({ ...newDevice, hour_on: Number(e.target.value) })}
                      className="w-1/2 p-2 border rounded-lg"
                      placeholder="Giờ"
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={newDevice.minute_on}
                      onChange={(e) => setNewDevice({ ...newDevice, minute_on: Number(e.target.value) })}
                      className="w-1/2 p-2 border rounded-lg"
                      placeholder="Phút"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian tắt
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={newDevice.hour_off}
                      onChange={(e) => setNewDevice({ ...newDevice, hour_off: Number(e.target.value) })}
                      className="w-1/2 p-2 border rounded-lg"
                      placeholder="Giờ"
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={newDevice.minute_off}
                      onChange={(e) => setNewDevice({ ...newDevice, minute_off: Number(e.target.value) })}
                      className="w-1/2 p-2 border rounded-lg"
                      placeholder="Phút"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newDevice.auto}
                    onChange={(e) => setNewDevice({ ...newDevice, auto: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm">Chế độ tự động</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newDevice.toggle}
                    onChange={(e) => setNewDevice({ ...newDevice, toggle: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm">Bật ngay lập tức</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khách hàng
                </label>
                <select
                  value={newDevice.tenant_id}
                  onChange={(e) => setNewDevice({ ...newDevice, tenant_id: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Khách hàng</option>
                  <option value="Tenant1">Khách hàng 1</option>
                  <option value="Tenant2">Khách hàng 2</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse md:flex-row gap-3 md:justify-end">
              <button
                onClick={() => setCreating(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleCreateDevice}
                disabled={!newDevice.name || !newDevice.mac || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Tạo thiết bị"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Device Table */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-semibold">Danh sách thiết bị</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Chưa có thiết bị nào được thêm
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tên</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 hidden md:table-cell">
                        MAC
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 hidden md:table-cell">
                        Tự động
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {devices.map((device) => (
                      <tr key={device.mac}>
                        <td className="px-4 py-4">
                          <div className="font-medium">{device.name}</div>
                          <div className="text-sm text-gray-500 md:hidden">{device.mac}</div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">{device.mac}</td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          {device.auto ? (
                            <span className="text-green-600">✔ Kích hoạt</span>
                          ) : (
                            <span className="text-gray-400">✖ Tắt</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => handleDeleteDevice(device.mac)}
                            className="text-red-600 hover:text-red-900 flex items-center"
                            disabled={loading}
                          >
                            {loading ? (
                              <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              "Xóa"
                            )}
                          </button>
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