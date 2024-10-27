import React, { useState, useEffect, Fragment } from "react";
import { Cluster, CreateUnit } from "../types/Cluster";
import { getClusters, createCluster, updateCluster, deleteCluster } from "../lib/api";
import { CreateClusterData } from "../types/Cluster";
import Cookies from "js-cookie";
import { useAPI } from "../contexts/APIProvider";
import { Navbar } from "../components/NavBar";

const ClusterPage: React.FC = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [editingClusterId, setEditingClusterId] = useState<number | null>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [formData, setFormData] = useState<{
    id?: number;
    name: string;
    units: CreateUnit[];
  }>({
    name: "",
    units: [{ id: null, name: "", mac: "" }],
  });
  const apiContext = useAPI();
  const permissions = apiContext?.permissions || [];

  useEffect(() => {
    fetchClusters();
  }, []);

  // Fetch all clusters
  const fetchClusters = async () => {
    setLoading(true);
    setError("");
    try {
      const token = Cookies.get("token") || "";
      const data = await getClusters(token);
      setClusters(data);
    } catch (err) {
      console.error(err);
      setError("Không lấy được dữ liệu cụm.");
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes for cluster name and units
  const handleInputChange = (field: string, value: string, index?: number, subField?: string) => {
    if (field === "name") {
      setFormData({ ...formData, name: value });
    } else if (field === "units" && typeof index === "number" && subField) {
      const updatedUnits = [...formData.units];
      if (subField === "name") {
        updatedUnits[index].name = value;
      } else if (subField === "mac") {
        updatedUnits[index].mac = value;
      }
      setFormData({ ...formData, units: updatedUnits });
    }
  };

  // Add a new unit field
  const addUnit = () => {
    setFormData({
      ...formData,
      units: [...formData.units, { id: null, name: "", mac: "" }],
    });
  };

  // Remove a unit field
  const removeUnit = (index: number) => {
    const updatedUnits = [...formData.units];
    updatedUnits.splice(index, 1);
    setFormData({ ...formData, units: updatedUnits });
  };

  // Handle creating a new cluster
  const handleCreateCluster = async () => {
    // Client-side validation
    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên cụm.");
      return;
    }

    if (formData.units.length === 0 || formData.units.some(unit => !unit.name.trim() || !unit.mac.trim())) {
      setError("Vui lòng nhập đầy đủ thông tin cho các tủ điều khiển.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = Cookies.get("token") || "";
      const newClusterData: CreateClusterData = {
        name: formData.name,
        units: formData.units,
      };
      const newCluster = await createCluster(token, newClusterData);
      setClusters([...clusters, newCluster]);
      setFormData({ name: "", units: [{ id: null, name: "", mac: "" }] });
      setCreating(false);
    } catch (err) {
      console.error(err);
      setError("Lỗi khi tạo cụm.");
    } finally {
      setLoading(false);
    }
  };

  // Handle updating an existing cluster
  const handleUpdateCluster = async (clusterId: number) => {
    // Client-side validation
    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên cụm.");
      return;
    }

    if (formData.units.length === 0 || formData.units.some(unit => !unit.name.trim() || !unit.mac.trim())) {
      setError("Vui lòng nhập đầy đủ thông tin cho các tủ điều khiển.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = Cookies.get("token") || "";
      formData.id = clusterId;
      const updatedCluster = await updateCluster(token, clusterId, formData);

      setClusters(
        clusters.map(cluster => (cluster.id === clusterId ? updatedCluster : cluster))
      );
      setEditingClusterId(null);
      setFormData({ name: "", units: [{ id: null, name: "", mac: "" }] });
    } catch (err) {
      console.error(err);
      setError("Lỗi khi cập nhật cụm.");
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a cluster
  const handleDeleteCluster = async (clusterId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa cụm này?")) return;

    setLoading(true);
    setError("");
    try {
      const token = Cookies.get("token") || "";
      await deleteCluster(token, clusterId);
      setClusters(clusters.filter(cluster => cluster.id !== clusterId));
    } catch (err) {
      console.error(err);
      setError("Lỗi khi xóa cụm.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>    
      <Navbar permissions={permissions} />

      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Quản Lý Cụm</h1>

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

          {/* Add New Cluster Button */}
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            >
              + Thêm Cụm Mới
            </button>
          )}

          {/* Create New Cluster Row */}
          {creating && (
            <div className="bg-white shadow rounded-lg mb-4 p-4">
              <h2 className="text-2xl font-semibold mb-4">Tạo Cụm Mới</h2>
              <div className="grid grid-cols-1 gap-4">
                {/* Cluster Name */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="new-cluster-name">
                    Tên Cụm
                  </label>
                  <input
                    type="text"
                    id="new-cluster-name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên cụm"
                  />
                </div>

                {/* Units */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Tủ điều khiển</label>
                  {formData.units.map((unit, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        placeholder="Tên Tủ điều khiển"
                        value={unit.name}
                        onChange={(e) => handleInputChange("units", e.target.value, index, "name")}
                        className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Mac Address Thiết bị"
                        value={unit.mac}
                        onChange={(e) => handleInputChange("units", e.target.value, index, "mac")}
                        className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {formData.units.length > 1 && (
                        <button
                          onClick={() => removeUnit(index)}
                          className="text-red-500 hover:text-red-700 focus:outline-none"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addUnit}
                    className="mt-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    + Thêm Tủ điều khiển
                  </button>
                </div>
              </div>
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={() => {
                    setCreating(false);
                    setFormData({ name: "", units: [{ id: null, name: "", mac: "" }] });
                    setError("");
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateCluster}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={loading}
                >
                  {loading ? "Đang tạo..." : "Tạo Cụm"}
                </button>
              </div>
            </div>
          )}

          {/* Clusters Table */}
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Tên Cụm
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Tủ điều khiển
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clusters.map((cluster) => (
                  <Fragment key={cluster.id}>
                    {/* Cluster Row */}
                    <tr className="hover:bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingClusterId === cluster.id ? (
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập tên cụm"
                          />
                        ) : (
                          <span className="text-sm text-gray-700">{cluster.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingClusterId === cluster.id ? (
                          <ul className="list-disc pl-5">
                            {formData.units.map((unit, index) => (
                              <li key={index} className="text-sm flex items-center space-x-2">
                                <input
                                  type="text"
                                  placeholder="Tên Tủ điều khiển"
                                  value={unit.name}
                                  onChange={(e) => handleInputChange("units", e.target.value, index, "name")}
                                  className="shadow-sm appearance-none border rounded w-1/2 py-1 px-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Địa Chỉ Tủ điều khiển"
                                  value={unit.mac}
                                  onChange={(e) => handleInputChange("units", e.target.value, index, "mac")}
                                  className="shadow-sm appearance-none border rounded w-1/2 py-1 px-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {formData.units.length > 1 && (
                                  <button
                                    onClick={() => removeUnit(index)}
                                    className="text-red-500 hover:text-red-700 focus:outline-none"
                                  >
                                    &times;
                                  </button>
                                )}
                              </li>
                            ))}
                            <li>
                              <button
                                onClick={addUnit}
                                className="mt-2 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                              >
                                + Thêm Tủ điều khiển
                              </button>
                            </li>
                          </ul>
                        ) : (
                          <ul className="list-disc pl-5">
                            {cluster.units.map((unit) => (
                              <li key={unit.id} className="text-sm">
                                <strong>{unit.name}</strong>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingClusterId === cluster.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUpdateCluster(cluster.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                              disabled={loading}
                            >
                              {loading ? "Đang lưu..." : "Lưu"}
                            </button>
                            <button
                              onClick={() => {
                                setEditingClusterId(null);
                                setFormData({ name: "", units: [{ id: null, name: "", mac: "" }] });
                                setError("");
                              }}
                              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                              disabled={loading}
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingClusterId(cluster.id);
                                setFormData({
                                  name: cluster.name,
                                  units: cluster.units.map(unit => ({ ...unit })),
                                });
                                setError("");
                              }}
                              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteCluster(cluster.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              Xóa
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  </Fragment>
                ))}
                {clusters.length === 0 && !loading && (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      Không có cụm nào được tìm thấy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Loading Spinner */}
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
};

export default ClusterPage;