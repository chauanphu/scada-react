import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import {
  getToken,
  checkLogin,
  getDevices,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  createDevice,
  updateDevice,
  deleteDevice,
  getEnergyData,
  getRoles,
  getAuditLogs,
  downloadCSVAudit,
  View,
  User,
  UserRole,
  TokenResponse,
  Device,
  CreateDeviceData,
  FirmwareMetadata,
  getLatestFirmware,
  getAllMetadata,
  uploadFirmware,
  updateDeviceFirmware,
  massUpdateFirmware,
  toggleDevice,
  setDeviceAuto,
  setDeviceSchedule,
  Schedule,
  deleteFirmware as apiDeleteFirmware,
} from "../lib/api";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

// Define role-based permissions
const ROLE_PERMISSIONS = {
  [UserRole.SUPERADMIN]: [
    "/",
    "/tenants",
    "/devices",
    "/users",
    "/roles",
    "/audit",
    "/firmware",
  ],
  [UserRole.ADMIN]: ["/", "/devices", "/users", "/audit", "/alerts"],
  [UserRole.OPERATOR]: ["/", "/devices"],
  [UserRole.MONITOR]: ["/", "/devices", "/audit", "/alerts"],
};

interface APIContextType {
  token: string | null;
  isAuthenticated: boolean;
  userRole: UserRole | null;
  tenantId: string | null;
  permissions: string[];
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  validateToken: () => Promise<boolean>;
  hasPermission: (path: string) => boolean;
  getUsers: () => Promise<User[]>;
  createUser: (userData: Partial<User>) => Promise<User>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<User>;
  deleteUser: (userId: string) => Promise<void | User>;
  getDevices: () => Promise<Device[]>;
  createDevice: (deviceData: CreateDeviceData) => Promise<Device>;
  updateDevice: (
    deviceId: string,
    deviceData: Partial<CreateDeviceData>
  ) => Promise<Device>;
  deleteDevice: (deviceId: string) => Promise<Device>;
  toggleDevice: (deviceId: string, state: boolean) => Promise<void>;
  setDeviceAuto: (deviceId: string, auto: boolean) => Promise<void>;
  setDeviceSchedule: (deviceId: string, schedule: Schedule) => Promise<void>;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  getEnergyData: (deviceId: string, view: View) => Promise<any>;
  getRoles: () => Promise<any>;
  getAuditLogs: (page?: number, page_size?: number) => Promise<any>;
  downloadCSVAudit: () => Promise<any>;
  // Firmware operations
  getLatestFirmware: () => Promise<FirmwareMetadata>;
  getAllFirmwareMetadata: () => Promise<FirmwareMetadata[]>;
  uploadFirmware: (version: string, file: File) => Promise<FirmwareMetadata>;
  updateDeviceFirmware: (deviceId: string, version: string) => Promise<void>;
  massUpdateFirmware: (version: string) => Promise<void>;
  deleteFirmware: (version: string) => Promise<void>;
}

const APIContext = createContext<APIContextType | undefined>(undefined);

export function APIProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    Cookies.get("token") || null
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const navigate = useNavigate();

  const validateToken = async (): Promise<boolean> => {
    if (token) {
      const isValid = await checkLogin(token);
      setIsAuthenticated(isValid);
      if (!isValid) {
        Cookies.remove("token");
        setToken(null);
        setUserRole(null);
        setTenantId(null);
        setPermissions([]);
      }
      return isValid;
    }
    return false;
  };

  useEffect(() => {
    validateToken();
    // Set userRole from cookies
    const role = Cookies.get("userRole") as UserRole;
    setUserRole(role);
    setPermissions(ROLE_PERMISSIONS[role] || []);
  }, [token]);

  const login = async (username: string, password: string) => {
    const response: TokenResponse = await getToken(username, password);
    const { access_token, role, tenant_id } = response;

    setToken(access_token);
    setUserRole(role);
    setTenantId(tenant_id || null);
    setPermissions(ROLE_PERMISSIONS[role] || []);
    setIsAuthenticated(true);
    // Set cookie with token
    Cookies.set("token", access_token);
    Cookies.set("userRole", role); // ✅ Store userRole in cookies
    Cookies.set("tenantId", tenant_id || ""); // ✅ Store tenantId in cookies
    // Navigate to home page
    navigate("/");
  };

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("userRole");
    Cookies.remove("tenantId");
    setToken(null);
    setIsAuthenticated(false);
    setUserRole(null);
    setTenantId(null);
    setPermissions([]);
    navigate("/login");
  };

  const hasPermission = (path: string): boolean => {
    if (userRole === UserRole.SUPERADMIN) return true;
    return permissions.includes(path);
  };

  const value = {
    token,
    isAuthenticated,
    userRole,
    tenantId,
    permissions,
    login,
    logout,
    validateToken,
    hasPermission,
    getUsers: () => getUsers(token || ""),
    createUser: (userData: Partial<User>) => createUser(token || "", userData),
    updateUser: (userId: string, userData: Partial<User>) =>
      updateUser(token || "", userId, userData),
    deleteUser: (userId: string) => deleteUser(token || "", userId),
    getDevices: () => getDevices(token || ""),
    createDevice: (deviceData: CreateDeviceData) =>
      createDevice(token || "", deviceData),
    updateDevice: (deviceId: string, deviceData: Partial<CreateDeviceData>) =>
      updateDevice(token || "", deviceId, deviceData),
    deleteDevice: (deviceId: string) => deleteDevice(token || "", deviceId),
    // Device control
    toggleDevice: (deviceId: string, state: boolean) =>
      toggleDevice(token || "", deviceId, state),
    setDeviceAuto: (deviceId: string, auto: boolean) =>
      setDeviceAuto(token || "", deviceId, auto),
    setDeviceSchedule: (deviceId: string, schedule: Schedule) =>
      setDeviceSchedule(token || "", deviceId, schedule),
    getEnergyData: (deviceId: string, view: View) =>
      getEnergyData(token || "", deviceId, view),
    getRoles: () => getRoles(token || ""),
    getAuditLogs: (page?: number, page_size?: number) =>
      getAuditLogs(token || "", page, page_size),
    downloadCSVAudit: () => downloadCSVAudit(token || ""),
    // Firmware functions
    getLatestFirmware: () => getLatestFirmware(token || ""),
    getAllFirmwareMetadata: () => getAllMetadata(token || ""),
    uploadFirmware: (version: string, file: File) =>
      uploadFirmware(token || "", version, file),
    updateDeviceFirmware: (deviceId: string, version: string) =>
      updateDeviceFirmware(token || "", deviceId, version),
    massUpdateFirmware: (version: string) =>
      massUpdateFirmware(token || "", version),
    deleteFirmware: (version: string) => 
      apiDeleteFirmware(token || "", version),
  };

  return <APIContext.Provider value={value}>{children}</APIContext.Provider>;
}

export function useAPI() {
  const context = useContext(APIContext);
  if (context === undefined) {
    throw new Error("useAPI must be used within an APIProvider");
  }
  return context;
}
