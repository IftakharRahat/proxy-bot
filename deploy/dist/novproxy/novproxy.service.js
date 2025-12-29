"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var NovproxyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NovproxyService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
let NovproxyService = NovproxyService_1 = class NovproxyService {
    configService;
    logger = new common_1.Logger(NovproxyService_1.name);
    client;
    apiKey;
    lang = 'en';
    constructor(configService) {
        this.configService = configService;
        const baseURL = this.configService.get('NOVPROXY_API_URL');
        this.apiKey = this.configService.get('NOVPROXY_API_KEY') || '';
        this.client = axios_1.default.create({
            baseURL,
            timeout: 30000,
        });
    }
    createFormData(params) {
        const form = new form_data_1.default();
        form.append('lang', this.lang);
        form.append('key', this.apiKey);
        for (const [key, value] of Object.entries(params)) {
            form.append(key, value);
        }
        return form;
    }
    async buyPort(days, quantity) {
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
    async getPortsList(page = 1, pageSize = 20, orderId) {
        const params = {
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
    async getOrderList(page = 1, pageSize = 20) {
        const form = this.createFormData({
            page: page.toString(),
            page_size: pageSize.toString(),
        });
        const response = await this.client.post('/port/get_order_list', form, {
            headers: form.getHeaders(),
        });
        return response.data;
    }
    async renewOrder(id, days) {
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
    async batchEditPorts(ids, options) {
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
    async getPortById(portId) {
        const result = await this.getPortsList(1, 100);
        if (result.code === 0 && result.data.list) {
            return result.data.list.find((p) => p.id === portId) || null;
        }
        return null;
    }
};
exports.NovproxyService = NovproxyService;
exports.NovproxyService = NovproxyService = NovproxyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], NovproxyService);
//# sourceMappingURL=novproxy.service.js.map