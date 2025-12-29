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
var UddoktaPayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UddoktaPayService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let UddoktaPayService = UddoktaPayService_1 = class UddoktaPayService {
    configService;
    logger = new common_1.Logger(UddoktaPayService_1.name);
    baseUrl;
    apiKey;
    constructor(configService) {
        this.configService = configService;
        this.baseUrl = this.configService.get('UDDOKTAPAY_BASE_URL') || '';
        this.apiKey = this.configService.get('UDDOKTAPAY_API_KEY') || '';
        if (!this.baseUrl || !this.apiKey) {
            this.logger.warn('UddoktaPay configuration missing. Payment features will fail.');
        }
    }
    async createCharge(amount, fullName, email, metadata) {
        try {
            const appUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
            const payload = {
                full_name: fullName,
                email: email || 'customer@example.com',
                amount: amount,
                metadata: metadata,
                redirect_url: `${appUrl}/payment/uddoktapay/success`,
                cancel_url: `${appUrl}/payment/uddoktapay/cancel`,
                webhook_url: `${appUrl}/payment/uddoktapay/webhook`,
            };
            const response = await axios_1.default.post(`${this.baseUrl}/api/checkout-v2`, payload, {
                headers: {
                    'RT-UDDOKTAPAY-API-KEY': this.apiKey,
                    'Content-Type': 'application/json',
                },
            });
            if (response.data && response.data.status === true) {
                return {
                    payment_url: response.data.payment_url,
                    invoice_id: response.data.invoice_id
                };
            }
            else {
                throw new Error(response.data.message || 'Failed to create charge');
            }
        }
        catch (error) {
            this.logger.error(`Create Charge Failed: ${error.message}`, error.response?.data);
            throw new common_1.BadRequestException('Payment initialization failed');
        }
    }
    async verifyPayment(invoiceId) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/api/verify-payment`, { invoice_id: invoiceId }, {
                headers: {
                    'RT-UDDOKTAPAY-API-KEY': this.apiKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Verification Failed: ${error.message}`, error.response?.data);
            throw new common_1.BadRequestException('Payment verification failed');
        }
    }
};
exports.UddoktaPayService = UddoktaPayService;
exports.UddoktaPayService = UddoktaPayService = UddoktaPayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UddoktaPayService);
//# sourceMappingURL=uddoktapay.service.js.map