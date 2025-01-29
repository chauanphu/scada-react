import { useState, useEffect } from "react";
import { Device, CreateDeviceData } from "../lib/api";
import { useAPI } from "../contexts/APIProvider";
import { getDevices, createDevice, 
  // updateDevice, 
  deleteDevice } from "../lib/api";

export const DevicesPage: React.FC = () => {
  const apiContext = useAPI();
  const [devices, setDevices] = useState<Device[]>([]);
  const [, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [newDevice, setNewDevice] = useState<CreateDeviceData>({
    name: "",
    mac: "",
  });

  const handleConfirmDelete = () => {
    return window.confirm("Bạn có chắc chắn muốn xóa thiết bị này?");
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchDevices = async () => {
    setLoading(true);
    setError("");
    try {
      const token = apiContext?.token || "";
      const data = await getDevices(token);
      setDevices(data);
    } catch (err) {
      console.error(err);
      setError("Lỗi khi tải danh sách thiết bị.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDevice = async () => {
    setLoading(true);
    setError("");
    try {
      const token = apiContext?.token || "";
      await createDevice(token, newDevice);
      await fetchDevices();
      setCreating(false);
      setNewDevice({ name: "", mac: "" });
    } catch (err) {
       
      console.error(err);
      setError("Lỗi khi tạo thiết bị mới.");
    } finally {
      setLoading(false);
    }
  };

   
  // const handleUpdateDevice = async (deviceId: string, deviceData: Partial<CreateDeviceData>) => {
  //   setLoading(true);
  //   setError("");
  //   try {
  //     const token = apiContext?.token || "";
  //     await updateDevice(token, deviceId, deviceData);
  //     await fetchDevices();
  //   } catch (err) {
       
  //     console.error(err);
  //     setError("Lỗi khi cập nhật thiết bị.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!handleConfirmDelete()) return;

    setLoading(true);
    setError("");
    try {
      const token = apiContext?.token || "";
      await deleteDevice(token, deviceId);
      setDevices(devices.filter(device => device._id !== deviceId));
    } catch (err) {
       
       
      console.error(err);
      setError("Lỗi khi xóa thiết bị.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return (
    <>    
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Quản Lý Thiết Bị</h1>

          {/* Error Message */}
          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
              role="alert"
            >
              <strong className="font-bold">Lỗi:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {/* Add New Device Button */}
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            >
              + Thêm Thiết Bị Mới
            </button>
          )}

          {/* Create New Device Form */}
          {creating && (
            <div className="bg-white shadow rounded-lg mb-4 p-4">
              <h2 className="text-2xl font-semibold mb-4">Tạo Thiết Bị Mới</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tên Thiết Bị
                  </label>
                  <input
                    type="text"
                    value={newDevice.name}
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, name: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    MAC Address
                  </label>
                  <input
                    type="text"
                    value={newDevice.mac}
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, mac: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vĩ Độ
                  </label>
                  <input
                    type="number"
                    value={newDevice.latitude || ""}
                    onChange={(e) =>
                      setNewDevice({
                        ...newDevice,
                        latitude: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Kinh Độ
                  </label>
                  <input
                    type="number"
                    value={newDevice.longitude || ""}
                    onChange={(e) =>
                      setNewDevice({
                        ...newDevice,
                        longitude: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setCreating(false);
                    setNewDevice({ name: "", mac: "" });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateDevice}
                  disabled={!newDevice.name || !newDevice.mac}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tạo
                </button>
              </div>
            </div>
          )}

          {/* Devices List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MAC Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vị Trí
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {devices.map((device) => (
                  <tr key={device._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {device.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{device.mac}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {device.latitude && device.longitude
                          ? `${device.latitude}, ${device.longitude}`
                          : "Chưa cập nhật"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteDevice(device._id)}
                        className="text-red-600 hover:text-red-900 ml-4"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}; 