export type Unit = {
    _id?: string;
    name: string;
    mac: string;
    latitude?: number;
    longitude?: number;
    toggle?: boolean;
    auto?: boolean;
    schedule?: Schedule;
    status?: UnitStatus;
    tenant_id?: string;
}

export type UnitStatus = {
    power: number;
    current: number;
    voltage: number;
    latitude: number;
    longitude: number;
    is_on: boolean;
    is_auto: boolean;
    is_connected: boolean;
    schedule: Schedule;
};

export type Cluster = {
    _id: string;
    name: string;
    units: Unit[];
    tenant_id?: string;
};

export type UserShortened = {
    user_id: number;
    username: string;
}

export type ClusterFull = {
    _id: string;
    name: string;
    units: Unit[];
    tenant_id?: string;
    created_at: string;
    updated_at: string;
};

export type CreateUnit = {
    name: string;
    mac: string;
    latitude?: number;
    longitude?: number;
};

export type CreateClusterData = {
    name: string;
    units: CreateUnit[];
}

export type Schedule = {
    hour_on: number;
    minute_on: number;
    hour_off: number;
    minute_off: number;
}