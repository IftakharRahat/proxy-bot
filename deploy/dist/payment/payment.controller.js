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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("./payment.service");
const uddoktapay_service_1 = require("./uddoktapay.service");
class SubmitPaymentDto {
    userId;
    amount;
    gateway;
    trxId;
}
class VerifyPaymentDto {
    transactionId;
}
let PaymentController = PaymentController_1 = class PaymentController {
    paymentService;
    uddoktaPayService;
    logger = new common_1.Logger(PaymentController_1.name);
    constructor(paymentService, uddoktaPayService) {
        this.paymentService = paymentService;
        this.uddoktaPayService = uddoktaPayService;
    }
    async submitPayment(dto) {
        const transaction = await this.paymentService.createTransaction(dto.userId, dto.amount, dto.gateway, dto.trxId);
        return {
            success: true,
            message: 'Payment submitted for verification',
            transactionId: transaction.id,
        };
    }
    async getPendingTransactions() {
        const transactions = await this.paymentService.getPendingTransactions();
        return { success: true, transactions };
    }
    async verifyPayment(id) {
        await this.paymentService.verifyTransaction(parseInt(id, 10));
        return { success: true, message: 'Payment verified and balance credited' };
    }
    async rejectPayment(id, body) {
        await this.paymentService.rejectTransaction(parseInt(id, 10), body.reason);
        return { success: true, message: 'Payment rejected' };
    }
    async handleWebhook(gateway, payload) {
        this.logger.log(`Webhook received from ${gateway}:`, JSON.stringify(payload));
        return { success: true, received: true };
    }
    async initUddoktaPayPayment(body) {
        return this.uddoktaPayService.createCharge(body.amount, body.fullName, body.email, { userId: body.userId });
    }
    async handleUddoktaPayWebhook(payload) {
        this.logger.log(`UddoktaPay Webhook: ${JSON.stringify(payload)}`);
        if (payload.status === 'COMPLETED') {
            const trxId = payload.transaction_id || payload.invoice_id;
            try {
                await this.paymentService.createTransaction(payload.metadata.userId, Number(payload.amount), payment_service_1.PaymentGateway.BKASH, trxId);
                const trx = await this.paymentService.getUserTransactions(payload.metadata.userId);
                const recentTrx = trx.find(t => t.trxId === trxId);
                if (recentTrx) {
                    await this.paymentService.verifyTransaction(recentTrx.id);
                }
            }
            catch (e) {
                if (e.message !== 'Transaction ID already exists') {
                    this.logger.error(`Failed to process webhook: ${e.message}`);
                }
                else {
                    this.logger.log('Transaction already processed (idempotency check)');
                }
            }
        }
        return { status: 'ok' };
    }
    async uddoktaPaySuccess(body) {
        return "Payment Successful! You can close this window and check your bot balance.";
    }
    async uddoktaPayCancel() {
        return "Payment Cancelled.";
    }
    async getUserHistory(userId) {
        const transactions = await this.paymentService.getUserTransactions(parseInt(userId, 10));
        return { success: true, transactions };
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('submit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SubmitPaymentDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "submitPayment", null);
__decorate([
    (0, common_1.Get)('pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPendingTransactions", null);
__decorate([
    (0, common_1.Post)('verify/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Post)('reject/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "rejectPayment", null);
__decorate([
    (0, common_1.Post)('webhook/:gateway'),
    __param(0, (0, common_1.Param)('gateway')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Post)('uddoktapay/init'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "initUddoktaPayPayment", null);
__decorate([
    (0, common_1.Post)('uddoktapay/webhook'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "handleUddoktaPayWebhook", null);
__decorate([
    (0, common_1.Get)('uddoktapay/success'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "uddoktaPaySuccess", null);
__decorate([
    (0, common_1.Get)('uddoktapay/cancel'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "uddoktaPayCancel", null);
__decorate([
    (0, common_1.Get)('history/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getUserHistory", null);
exports.PaymentController = PaymentController = PaymentController_1 = __decorate([
    (0, common_1.Controller)('payment'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService,
        uddoktapay_service_1.UddoktaPayService])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map