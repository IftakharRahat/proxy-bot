import { Context } from 'telegraf';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionManagerService } from '../../session-manager/session-manager.service';
import { PaymentService } from '../../payment/payment.service';
import { UddoktaPayService } from '../../payment/uddoktapay.service';
export declare class BotUpdateService {
    private prisma;
    private sessionManager;
    private paymentService;
    private uddoktaPayService;
    private readonly logger;
    constructor(prisma: PrismaService, sessionManager: SessionManagerService, paymentService: PaymentService, uddoktaPayService: UddoktaPayService);
    onPortSelect(ctx: Context): Promise<void>;
    private ensureUser;
    onStart(ctx: Context): Promise<void>;
    onBuy(ctx: Context): Promise<void>;
    onTierSelect(ctx: Context): Promise<void>;
    onDurationSelect(ctx: Context): Promise<void>;
    onProfile(ctx: Context): Promise<void>;
    onAssets(ctx: Context): Promise<void>;
    onRotateIp(ctx: Context): Promise<void>;
    onAddBalance(ctx: Context): Promise<void>;
    onPayAmount(ctx: Context): Promise<void>;
    onBackToStart(ctx: Context): Promise<void>;
}
