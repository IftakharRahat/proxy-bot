import { ConfigService } from '@nestjs/config';
export interface NovproxyResponse<T = any> {
    code: number;
    data: T;
    msg: string;
}
export interface PortInfo {
    id: number;
    ip: string;
    domain: string;
    port: number;
    username: string;
    password: string;
    mark: string;
    expired: string;
    minute: number;
    region: string;
    whites: string;
    format: string;
}
export interface OrderInfo {
    id: number;
    name: string;
    value: number;
    expired: string;
    hour: number;
    percent: number;
}
export interface PortListResponse {
    list: PortInfo[];
    total: number;
}
export declare class NovproxyService {
    private configService;
    private readonly logger;
    private readonly client;
    private readonly apiKey;
    private readonly lang;
    constructor(configService: ConfigService);
    private createFormData;
    buyPort(days: number, quantity: number): Promise<NovproxyResponse>;
    getPortsList(page?: number, pageSize?: number, orderId?: string): Promise<NovproxyResponse<PortListResponse>>;
    getOrderList(page?: number, pageSize?: number): Promise<NovproxyResponse<OrderInfo[]>>;
    renewOrder(id: number, days: number): Promise<NovproxyResponse>;
    batchEditPorts(ids: number[], options: {
        username: string;
        password: string;
        region: string;
        minute: number;
        mark?: string;
        format?: string;
    }): Promise<NovproxyResponse>;
    getPortById(portId: number): Promise<PortInfo | null>;
}
