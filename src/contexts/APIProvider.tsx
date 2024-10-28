import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import {
    getToken,
    checkLogin,
    getClusters,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getFullClusters,
    createCluster,
    updateCluster,
    deleteCluster,
    getEnergyData,
    getRoles,
    getAuditLogs,
    downloadCSVAudit,
    getPermissions,
    View,
    User
} from "../lib/api";
import { useNavigate } from 'react-router-dom';
import Cookies from "js-cookie";
import { Cluster, ClusterFull, CreateClusterData } from "../types/Cluster";
import { PermissionEnum } from "../components/NavBar";

interface APIContextType {
    token: string | null;
    isAuthenticated: boolean;
    clusters: Cluster[];
    permissions: PermissionEnum[];
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    hasPermission: (permission: PermissionEnum) => boolean;
    getUsers: () => Promise<User[]>;
    createUser: (userData: Partial<User>) => Promise<User>;
    updateUser: (userId: number, userData: Partial<User>) => Promise<User>;
    deleteUser: (userId: number) => Promise<void | User>;
    getFullClusters: () => Promise<ClusterFull[] | Cluster | void>;
    createCluster: (clusterData: CreateClusterData) => Promise<Cluster>;
    updateCluster: (clusterId: number, clusterData: Partial<CreateClusterData>) => Promise<Cluster>;
    deleteCluster: (clusterId: number) => Promise<ClusterFull | void>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getEnergyData: (view: View) => Promise<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getRoles: () => Promise<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAuditLogs: (page?: number, page_size?: number) => Promise<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    downloadCSVAudit: () => Promise<any>;
}

const APIContext = createContext<APIContextType | null>(null)

interface APIProviderProps {
    children: ReactNode;
}

export const APIProvider: React.FC<APIProviderProps> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [clusters, setClusters] = useState<Cluster[]>([]);
    const [permissions, setPermissions] = useState<PermissionEnum[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUserAuth = async () => {
            const storedToken = Cookies.get("token");
            if (storedToken && await checkLogin(storedToken)) {
                setToken(storedToken);
                setIsAuthenticated(true);
                fetchClusters(storedToken);
                fetchPermissions(storedToken);  // Fetch permissions
            } else {
                setToken(null);
                setIsAuthenticated(false);
                navigate("/login");
            }
        };

        checkUserAuth();
    }, [navigate]);

    const fetchClusters = async (token: string) => {
        const data = await getClusters(token);
        setClusters(data);
    };

    const fetchPermissions = async (token: string) => {
        try {
            const userPermissions = await getPermissions(token);
            setPermissions(userPermissions);
        } catch (error) {
            console.error("Failed to fetch permissions", error);
        }
    };

    const login = async (username: string, password: string) => {
        try {
            const authToken = await getToken(username, password);
            Cookies.set("token", authToken);

            setToken(authToken);
            setIsAuthenticated(true);
            // fetchClusters(authToken);
            fetchPermissions(authToken);  // Fetch permissions after login
        } catch (error) {
            console.error("Login failed", error);
            setIsAuthenticated(false);
        }
    };

    const logout = () => {
        setToken(null);
        setIsAuthenticated(false);
        Cookies.remove('token');
        navigate("/login");
    };

    const hasPermission = (permission: PermissionEnum): boolean => {
        return permissions.includes(permission);
    };

    if (APIContext === null) {
        throw new Error("useAPI must be used within a APIProvider");
    }

    return (
        <APIContext.Provider
            value={{
                token,
                isAuthenticated,
                clusters,
                permissions,
                login,
                logout,
                hasPermission, 
                getUsers: () => token ? getUsers(token) : Promise.reject("Not authenticated"),
                createUser: (userData: Partial<User>) => token ? createUser(token, userData) : Promise.reject("Not authenticated"),
                updateUser: (userId: number, userData: Partial<User>) => token ? updateUser(token, userId, userData) : Promise.reject("Not authenticated"),
                deleteUser: (userId: number) => token ? deleteUser(token, userId) : Promise.reject("Not authenticated"),
                getFullClusters: () => token ? getFullClusters(token) : Promise.reject("Not authenticated"),
                createCluster: (clusterData: CreateClusterData) => token ? createCluster(token, clusterData) : Promise.reject("Not authenticated"),
                updateCluster: (clusterId: number, clusterData: Partial<CreateClusterData>) => token ? updateCluster(token, clusterId, clusterData) : Promise.reject("Not authenticated"),
                deleteCluster: (clusterId: number) => token ? deleteCluster(token, clusterId) : Promise.reject("Not authenticated"),
                getEnergyData: (view: View) => token ? getEnergyData(token, view) : Promise.reject("Not authenticated"),
                getRoles: () => token ? getRoles(token) : Promise.reject("Not authenticated"),
                getAuditLogs: (page: number = 1, page_size: number = 10) => token ? getAuditLogs(token, page, page_size) : Promise.reject("Not authenticated"),
                downloadCSVAudit: () => token ? downloadCSVAudit(token) : Promise.reject("Not authenticated"),
            }}
        >
            {children}
        </APIContext.Provider>
    );
};

export const useAPI = () => useContext(APIContext);
