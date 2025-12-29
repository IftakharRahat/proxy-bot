import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

export enum PaymentGateway {
    BKASH = 'bKash',
    NAGAD = 'Nagad',
    ROCKET = 'Rocket',
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Create a new pending transaction
     */
    async createTransaction(
        userId: number,
        amount: number,
        gateway: PaymentGateway,
        trxId: string,
    ) {
        // Check if transaction ID already exists
        const existing = await this.prisma.transaction.findUnique({
            where: { trxId },
        });

        if (existing) {
            throw new BadRequestException('Transaction ID already exists');
        }

        const transaction = await this.prisma.transaction.create({
            data: {
                userId,
                amount: new Decimal(amount),
                gateway,
                trxId,
                status: TransactionStatus.PENDING,
            },
        });

        this.logger.log(`Transaction created: ${trxId} for user ${userId}, amount: ${amount}`);
        return transaction;
    }

    /**
     * Verify and complete a transaction (manual admin verification)
     */
    async verifyTransaction(transactionId: number): Promise<boolean> {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        if (transaction.status === TransactionStatus.COMPLETED) {
            throw new BadRequestException('Transaction already completed');
        }

        // Complete transaction and credit balance
        await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Update transaction status
            await tx.transaction.update({
                where: { id: transactionId },
                data: { status: TransactionStatus.COMPLETED },
            });

            // Credit user balance
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

    /**
     * Reject a transaction
     */
    async rejectTransaction(transactionId: number, reason?: string): Promise<boolean> {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        if (transaction.status !== TransactionStatus.PENDING) {
            throw new BadRequestException('Can only reject pending transactions');
        }

        await this.prisma.transaction.update({
            where: { id: transactionId },
            data: { status: TransactionStatus.FAILED },
        });

        this.logger.log(`Transaction ${transactionId} rejected. Reason: ${reason || 'Not specified'}`);
        return true;
    }

    /**
     * Get user's transaction history
     */
    async getUserTransactions(userId: number) {
        return this.prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }

    /**
     * Get all pending transactions (for admin)
     */
    async getPendingTransactions() {
        return this.prisma.transaction.findMany({
            where: { status: TransactionStatus.PENDING },
            include: { user: true },
            orderBy: { createdAt: 'asc' },
        });
    }

    /**
     * Get user's current balance
     */
    async getUserBalance(userId: number): Promise<Decimal> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { balance: true },
        });

        return user?.balance || new Decimal(0);
    }

    /**
     * Deduct balance from user (for purchases) and award referral bonus
     */
    async deductBalance(userId: number, amount: number): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { referredBy: true },
        });

        if (!user || Number(user.balance) < amount) {
            throw new BadRequestException('Insufficient balance');
        }

        const bonus = Number(amount) * 0.10;

        await this.prisma.$transaction(async (tx) => {
            // 1. Deduct from buyer
            await tx.user.update({
                where: { id: userId },
                data: {
                    balance: { decrement: amount },
                },
            });

            // 2. Award bonus to referrer (if exists)
            if (user.referredById) {
                await tx.user.update({
                    where: { id: user.referredById },
                    data: {
                        balance: { increment: bonus },
                        referralEarnings: { increment: bonus },
                    },
                });
                this.logger.log(`Awarded ${bonus} bonus to referrer ${user.referredById} for purchase by ${userId}`);
            }
        });

        this.logger.log(`Deducted ${amount} from user ${userId}`);
        return true;
    }
}
