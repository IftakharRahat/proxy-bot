import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

// Response types
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

@Injectable()
export class NovproxyService {
    private readonly logger = new Logger(NovproxyService.name);
    private readonly client: AxiosInstance;
    private readonly apiKey: string;
    private readonly lang = 'en';

    constructor(private configService: ConfigService) {
        const baseURL = this.configService.get<string>('NOVPROXY_API_URL');
        this.apiKey = this.configService.get<string>('NOVPROXY_API_KEY') || '';

        this.client = axios.create({
            baseURL,
            timeout: 30000,
        });
    }

    private createFormData(params: Record<string, string>): FormData {
        const form = new FormData();
        form.append('lang', this.lang);
        form.append('key', this.apiKey);
        for (const [key, value] of Object.entries(params)) {
            form.append(key, value);
        }
        return form;
    }

    /**
     * Buy new ports from Novproxy
     */
    async buyPort(days: number, quantity: number): Promise<NovproxyResponse> {
        const form = this.createFormData({
            day: days.toString(),
            num: quantity.toString(),
        });

        const response = await this.client.post('/port/buy', form, {
            headers: form.getHeaders(),
        });

        this.logger.log(`buyPort: ${quantity} ports for ${days} days`);
        return response.data;
    }

    /**
     * Get list of all ports
     */
    async getPortsList(
        page = 1,
        pageSize = 20,
        orderId?: string,
    ): Promise<NovproxyResponse<PortListResponse>> {
        const params: Record<string, string> = {
            page: page.toString(),
            page_size: pageSize.toString(),
        };
        if (orderId) {
            params.order_id = orderId;
        }

        const form = this.createFormData(params);
        const response = await this.client.post('/port/get_list', form, {
            headers: form.getHeaders(),
        });

        return response.data;
    }

    /**
     * Get list of all orders
     */
    async getOrderList(
        page = 1,
        pageSize = 20,
    ): Promise<NovproxyResponse<OrderInfo[]>> {
        const form = this.createFormData({
            page: page.toString(),
            page_size: pageSize.toString(),
        });

        const response = await this.client.post('/port/get_order_list', form, {
            headers: form.getHeaders(),
        });

        return response.data;
    }

    /**
     * Renew an existing order/port
     */
    async renewOrder(id: number, days: number): Promise<NovproxyResponse> {
        const form = this.createFormData({
            id: id.toString(),
            day: days.toString(),
        });

        const response = await this.client.post('/port/renew_order', form, {
            headers: form.getHeaders(),
        });

        this.logger.log(`renewOrder: ID ${id} for ${days} days`);
        return response.data;
    }

    /**
     * Batch edit port settings (username, password, region, rotation)
     */
    async batchEditPorts(
        ids: number[],
        options: {
            username: string;
            password: string;
            region: string;
            minute: number;
            mark?: string;
            format?: string;
        },
    ): Promise<NovproxyResponse> {
        const form = this.createFormData({
            ids: ids.join(','),
            username: options.username,
            password: options.password,
            region: options.region,
            minute: options.minute.toString(),
            mark: options.mark || '',
            format: options.format || '1',
        });

        const response = await this.client.post('/port/batch_edit', form, {
            headers: form.getHeaders(),
        });

        this.logger.log(`batchEditPorts: IDs ${ids.join(',')} - region: ${options.region}`);
        return response.data;
    }

    /**
     * Helper: Get a single port by ID
     */
    async getPortById(portId: number): Promise<PortInfo | null> {
        const result = await this.getPortsList(1, 100);
        if (result.code === 0 && result.data.list) {
            return result.data.list.find((p) => p.id === portId) || null;
        }
        return null;
    }
}
