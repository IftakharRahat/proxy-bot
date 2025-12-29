import { PaymentService, PaymentGateway } from './payment.service';
import { UddoktaPayService } from './uddoktapay.service';
declare class SubmitPaymentDto {
    userId: number;
    amount: number;
    gateway: PaymentGateway;
    trxId: string;
}
export declare class PaymentController {
    private paymentService;
    private uddoktaPayService;
    private readonly logger;
    constructor(paymentService: PaymentService, uddoktaPayService: UddoktaPayService);
    submitPayment(dto: SubmitPaymentDto): Promise<{
        success: boolean;
        message: string;
        transactionId: number;
    }>;
    getPendingTransactions(): Promise<{
        success: boolean;
        transactions: ({
            user: {
                id: number;
                username: string | null;
                createdAt: Date;
                updatedAt: Date;
                telegramId: string;
                balance: import("@prisma/client/runtime/library").Decimal;
                role: import(".prisma/client").$Enums.UserRole;
            };
        } & {
            id: number;
            createdAt: Date;
            userId: number;
            status: string;
            trxId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            gateway: string;
        })[];
    }>;
    verifyPayment(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectPayment(id: string, body: {
        reason?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    handleWebhook(gateway: string, payload: any): Promise<{
        success: boolean;
        received: boolean;
    }>;
    initUddoktaPayPayment(body: {
        userId: number;
        amount: number;
        fullName: string;
        email: string;
    }): Promise<{
        payment_url: any;
        invoice_id: any;
    }>;
    handleUddoktaPayWebhook(payload: any): Promise<{
        status: string;
    }>;
    uddoktaPaySuccess(body: any): Promise<string>;
    uddoktaPayCancel(): Promise<string>;
    getUserHistory(userId: string): Promise<{
        success: boolean;
        transactions: {
            id: number;
            createdAt: Date;
            userId: number;
            status: string;
            trxId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            gateway: string;
        }[];
    }>;
}
export {};
