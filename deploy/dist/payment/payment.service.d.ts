import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
export declare enum PaymentGateway {
    BKASH = "bKash",
    NAGAD = "Nagad",
    ROCKET = "Rocket"
}
export declare enum TransactionStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare class PaymentService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createTransaction(userId: number, amount: number, gateway: PaymentGateway, trxId: string): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        status: string;
        trxId: string;
        amount: Prisma.Decimal;
        currency: string;
        gateway: string;
    }>;
    verifyTransaction(transactionId: number): Promise<boolean>;
    rejectTransaction(transactionId: number, reason?: string): Promise<boolean>;
    getUserTransactions(userId: number): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        status: string;
        trxId: string;
        amount: Prisma.Decimal;
        currency: string;
        gateway: string;
    }[]>;
    getPendingTransactions(): Promise<({
        user: {
            id: number;
            username: string | null;
            createdAt: Date;
            updatedAt: Date;
            telegramId: string;
            balance: Prisma.Decimal;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        id: number;
        createdAt: Date;
        userId: number;
        status: string;
        trxId: string;
        amount: Prisma.Decimal;
        currency: string;
        gateway: string;
    })[]>;
    getUserBalance(userId: number): Promise<Decimal>;
    deductBalance(userId: number, amount: number): Promise<boolean>;
}
