export enum TaskType {
    DISCONNECTION = 'disconnection',
    POWER_LOST = 'power_lost',
}

export enum TaskStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
}

export type Task = {
    _id: string;
    timestamp: string;
    device_id: string;
    device_name: string;
    type: TaskType;
    status: TaskStatus;
    assigned_to?: string;
    description?: string;
    tenant_id?: string;
}