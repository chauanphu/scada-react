import { useState, useEffect, useCallback } from "react";
import { useAPI } from "../contexts/APIProvider";
import { Device, FirmwareMetadata } from "../lib/api";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

// Utility function for formatting dates
const formatLocalDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Get the timezone offset in hours
  const offsetMilliseconds = date.getTimezoneOffset() * 60 * 1000;
  // Adjust the date object to the local timezone
  date.setTime(date.getTime() - offsetMilliseconds);

  // Format the date string in the local timezone
  const formattedDate = date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  return `${formattedDate}`;
};

export const FirmwarePage = () => {
  const apiContext = useAPI();
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [firmwareFile, setFirmwareFile] = useState<File | null>(null);
  const [firmwareVersion, setFirmwareVersion] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [latestFirmware, setLatestFirmware] = useState<FirmwareMetadata | null>(null);
  const [updateType, setUpdateType] = useState<"selected" | "all">("selected");
  const [allFirmware, setAllFirmware] = useState<FirmwareMetadata[]>([]);

  const fetchDevices = useCallback(async () => {
    try {
      const fetchedDevices = await apiContext.getDevices();
      setDevices(fetchedDevices);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách thiết bị" + error
      });
    }
  }, [apiContext, toast]);

  const fetchLatestFirmware = useCallback(async () => {
    try {
      const firmware = await apiContext.getLatestFirmware();
      setLatestFirmware(firmware);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải thông tin firmware hiện tại" + error
      });
    }
  }, [apiContext, toast]);

  const fetchAllFirmware = useCallback(async () => {
    try {
      const firmwareList = await apiContext.getAllFirmwareMetadata();
      setAllFirmware(firmwareList);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách firmware" + error
      });
    }
  }, [apiContext, toast]);

  useEffect(() => {
    void fetchDevices();
    void fetchLatestFirmware();
    void fetchAllFirmware();
  }, [fetchDevices, fetchLatestFirmware, fetchAllFirmware]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFirmwareFile(file);
    }
  };

  const handleVersionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFirmwareVersion(event.target.value);
  };

  const handleVersionSelectChange = (value: string) => {
    setFirmwareVersion(value);
  };

  const handleSelectAll = () => {
    if (selectedDevices.length === devices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(devices.map((device) => device._id));
    }
  };

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleUpload = async () => {
    if (!firmwareFile || !firmwareVersion) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng cung cấp file firmware và phiên bản"
      });
      return;
    }

    setLoading(true);
    try {
      await apiContext.uploadFirmware(firmwareVersion, firmwareFile);
      toast({
        title: "Thành công",
        description: "Tải lên firmware thành công"
      });
      void fetchLatestFirmware();
      void fetchAllFirmware();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải lên firmware" + error
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!firmwareVersion) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng chọn phiên bản firmware"
      });
      return;
    }

    if (updateType === "selected" && selectedDevices.length === 0) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng chọn thiết bị cần cập nhật"
      });
      return;
    }

    setLoading(true);
    try {
      if (updateType === "all") {
        await apiContext.massUpdateFirmware(firmwareVersion);
        toast({
          title: "Thành công",
          description: "Đã bắt đầu cập nhật tất cả thiết bị"
        });
      } else {
        await Promise.all(
          selectedDevices.map((deviceId) =>
            apiContext.updateDeviceFirmware(deviceId, firmwareVersion)
          )
        );
        toast({
          title: "Thành công",
          description: "Đã bắt đầu cập nhật các thiết bị đã chọn"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật firmware" + error
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFirmware = async (version: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa firmware phiên bản ${version}? Hành động này không thể hoàn tác.`)) {
      return;
    }

    setLoading(true);
    try {
      await apiContext.deleteFirmware(version);
      toast({
        title: "Thành công",
        description: `Đã xóa firmware phiên bản ${version}`
      });
      void fetchLatestFirmware();
      void fetchAllFirmware();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa firmware: " + error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Quản lý firmware</h1>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Phiên bản hiện tại</h2>
          {latestFirmware ? (
            <div>
              <p>Phiên bản: {latestFirmware.version}</p>
              <p>
                Ngày tải lên:{" "}
                {formatLocalDate(latestFirmware.upload_time)}
              </p>
            </div>
          ) : (
            <p>Chưa có thông tin firmware</p>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Danh sách firmware</h2>
          {allFirmware.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phiên bản</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tải lên</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allFirmware.map((firmware, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{firmware.version}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatLocalDate(firmware.upload_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteFirmware(firmware.version)}
                          disabled={loading}
                        >
                          Xóa
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Chưa có firmware nào được tải lên</p>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Tải lên firmware mới</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Phiên bản</Label>
              <Input
                type="text"
                value={firmwareVersion}
                onChange={handleVersionChange}
                placeholder="VD: 1.0.0"
              />
            </div>
            <div className="space-y-2">
              <Label>Tập tin Firmware</Label>
              <Input
                type="file"
                accept=".bin,.hex"
                onChange={handleFileChange}
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={loading || !firmwareFile || !firmwareVersion}
              variant={loading || !firmwareFile || !firmwareVersion ? "secondary" : "default"}
            >
              {loading ? "Đang tải lên..." : "Tải lên Firmware"}
            </Button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Cập nhật thiết bị</h2>

          <div className="space-y-4 mb-6">
            <div>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="selected"
                    checked={updateType === "selected"}
                    onChange={() => setUpdateType("selected")}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Thiết bị đã chọn</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="all"
                    checked={updateType === "all"}
                    onChange={() => setUpdateType("all")}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Tất cả thiết bị</span>
                </label>
              </div>
            </div>

            {updateType === "selected" && (
              <>
                <div className="mb-4">
                  <Button
                    variant="outline"
                    onClick={handleSelectAll}
                  >
                    {selectedDevices.length === devices.length
                      ? "Bỏ chọn tất cả"
                      : "Chọn tất cả"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {devices.map((device) => (
                    <div
                      key={device._id}
                      className={`p-4 rounded-lg border-2 ${
                        selectedDevices.includes(device._id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                      onClick={() => handleDeviceSelect(device._id)}
                      role="checkbox"
                      aria-checked={selectedDevices.includes(device._id)}
                      tabIndex={0}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleDeviceSelect(device._id);
                        }
                      }}
                    >
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={selectedDevices.includes(device._id)}
                          onChange={() => handleDeviceSelect(device._id)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label className="ml-2 text-sm font-medium text-gray-700">
                          {device.name}
                        </label>
                      </div>
                      <p className="text-sm text-gray-500">MAC: {device.mac}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Phiên bản mục tiêu</Label>
              {allFirmware.length > 0 ? (
                <Select 
                  value={firmwareVersion} 
                  onValueChange={handleVersionSelectChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn phiên bản firmware" />
                  </SelectTrigger>
                  <SelectContent>
                    {allFirmware.map((firmware) => (
                      <SelectItem key={firmware.version} value={firmware.version}>
                        {firmware.version} - {formatLocalDate(firmware.upload_time).split(',')[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="text"
                  value={firmwareVersion}
                  onChange={handleVersionChange}
                  placeholder="VD: 1.0.0"
                />
              )}
            </div>

            <Button
              onClick={handleUpdate}
              disabled={
                loading ||
                !firmwareVersion ||
                (updateType === "selected" && selectedDevices.length === 0)
              }
              variant={loading || !firmwareVersion || (updateType === "selected" && selectedDevices.length === 0)
                ? "secondary"
                : "default"
              }
            >
              {loading ? "Đang cập nhật..." : "Cập nhật Firmware"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};