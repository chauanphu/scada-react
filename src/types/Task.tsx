export enum TaskType {
    DISCONNECTION = 'Mất kết nối',
    POWERLOST = 'Mất điện',
}
export enum TaskStatus {
    PENDING = 'Chưa xử lý',
    IN_PROGRESS = 'Đang xử lý',
    COMPLETED = 'Đã xử lý',
}

export type Task = {
    id: string;
    time: string;
    device: string;
    type: TaskType;
    status: TaskStatus;
    assignedTo: string;
}