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
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = exports.TransactionStatus = exports.PaymentGateway = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
var PaymentGateway;
(function (PaymentGateway) {
    PaymentGateway["BKASH"] = "bKash";
    PaymentGateway["NAGAD"] = "Nagad";
    PaymentGateway["ROCKET"] = "Rocket";
})(PaymentGateway || (exports.PaymentGateway = PaymentGateway = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["COMPLETED"] = "COMPLETED";
    TransactionStatus["FAILED"] = "FAILED";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
let PaymentService = PaymentService_1 = class PaymentService {
    prisma;
    logger = new common_1.Logger(PaymentService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTransaction(userId, amount, gateway, trxId) {
        const existing = await this.prisma.transaction.findUnique({
            where: { trxId },
        });
        if (existing) {
            throw new common_1.BadRequestException('Transaction ID already exists');
        }
        const transaction = await this.prisma.transaction.create({
            data: {
                userId,
                amount: new library_1.Decimal(amount),
                gateway,
                trxId,
                status: TransactionStatus.PENDING,
            },
        });
        this.logger.log(`Transaction created: ${trxId} for user ${userId}, amount: ${amount}`);
        return transaction;
    }
    async verifyTransaction(transactionId) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        if (transaction.status === TransactionStatus.COMPLETED) {
            throw new common_1.BadRequestException('Transaction already completed');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.transaction.update({
                where: { id: transactionId },
                data: { status: TransactionStatus.COMPLETED },
            });
            await tx.user.update({
                where: { id: transaction.userId },
                data: {
                    balance: { increment: transaction.amount },
                },
            });
        });
        this.logger.log(`Transaction ${transactionId} verified, credited ${transaction.amount} to user ${transaction.userId}`);
        return true;
    }
    async rejectTransaction(transactionId, reason) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        if (transaction.status !== TransactionStatus.PENDING) {
            throw new common_1.BadRequestException('Can only reject pending transactions');
        }
        await this.prisma.transaction.update({
            where: { id: transactionId },
            data: { status: TransactionStatus.FAILED },
        });
        this.logger.log(`Transaction ${transactionId} rejected. Reason: ${reason || 'Not specified'}`);
        return true;
    }
    async getUserTransactions(userId) {
        return this.prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }
    async getPendingTransactions() {
        return this.prisma.transaction.findMany({
            where: { status: TransactionStatus.PENDING },
            include: { user: true },
            orderBy: { createdAt: 'asc' },
        });
    }
    async getUserBalance(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { balance: true },
        });
        return user?.balance || new library_1.Decimal(0);
    }
    async deductBalance(userId, amount) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || Number(user.balance) < amount) {
            throw new common_1.BadRequestException('Insufficient balance');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                balance: { decrement: amount },
            },
        });
        this.logger.log(`Deducted ${amount} from user ${userId}`);
        return true;
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map