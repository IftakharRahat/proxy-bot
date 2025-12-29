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
var BotUpdateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotUpdateService = void 0;
const common_1 = require("@nestjs/common");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const prisma_service_1 = require("../../prisma/prisma.service");
const session_manager_service_1 = require("../../session-manager/session-manager.service");
const payment_service_1 = require("../../payment/payment.service");
const uddoktapay_service_1 = require("../../payment/uddoktapay.service");
const PACKAGES = {
    bronze: { name: '🥉 Bronze', prices: { '24h': 50, '3d': 120, '7d': 250, '30d': 800 } },
    silver: { name: '🥈 Silver', prices: { '24h': 80, '3d': 200, '7d': 400, '30d': 1200 } },
    premium: { name: '🥇 Premium', prices: { '24h': 120, '3d': 300, '7d': 600, '30d': 1800 } },
};
const DURATIONS = {
    '24h': 24,
    '3d': 72,
    '7d': 168,
    '30d': 720,
};
let BotUpdateService = BotUpdateService_1 = class BotUpdateService {
    prisma;
    sessionManager;
    paymentService;
    uddoktaPayService;
    logger = new common_1.Logger(BotUpdateService_1.name);
    constructor(prisma, sessionManager, paymentService, uddoktaPayService) {
        this.prisma = prisma;
        this.sessionManager = sessionManager;
        this.paymentService = paymentService;
        this.uddoktaPayService = uddoktaPayService;
        console.log('!!! BotUpdateService CONSTRUCTOR CALLED !!!');
        this.logger.log('BotUpdateService initialized');
    }
    async onPortSelect(ctx) {
        const match = ctx.match;
        const portId = parseInt(match[1], 10);
        const tier = match[2];
        const duration = match[3];
        const pkg = PACKAGES[tier];
        const price = pkg?.prices[duration];
        const hours = DURATIONS[duration];
        if (!pkg || !price || !hours)
            return;
        const user = await this.ensureUser(ctx);
        if (!user)
            return;
        if (Number(user.balance) < price) {
            await ctx.replyWithHTML(`❌ <b>Insufficient Balance</b>`);
            await ctx.answerCbQuery();
            return;
        }
        try {
            await this.paymentService.deductBalance(user.id, price);
            const session = await this.sessionManager.createSession(user.id, portId, hours);
            await ctx.replyWithHTML(`✅ <b>Purchase Successful!</b>\n\n` +
                `🌍 <b>${session.country} Proxy</b>\n` +
                `Host: <code>${session.host}:${session.port}</code>\n` +
                `User: <code>${session.username}</code>\n` +
                `Pass: <code>${session.password}</code>\n\n` +
                `Expires: ${session.expiresAt.toLocaleString()}\n\n` +
                `<i>You can verify this in "My Assets"</i>`, telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('📦 My Assets', 'assets')],
                [telegraf_1.Markup.button.callback('⬅️ Back to Menu', 'start')],
            ]));
            this.logger.log(`User ${user.id} bought proxy on port ${portId} for ${price}`);
        }
        catch (error) {
            this.logger.error(`Purchase failed for user ${user.id}: ${error.message}`);
            await ctx.replyWithHTML(`❌ <b>Purchase Failed</b>\n${error.message}`);
        }
        await ctx.answerCbQuery();
    }
    async ensureUser(ctx) {
        const telegramId = ctx.from?.id?.toString();
        if (!telegramId)
            return null;
        let user = await this.prisma.user.findUnique({
            where: { telegramId },
        });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    telegramId,
                    username: ctx.from?.username || null,
                },
            });
            this.logger.log(`New user created: ${telegramId}`);
        }
        return user;
    }
    async onStart(ctx) {
        this.logger.log(`Received /start command from ${ctx.from?.id}`);
        await this.ensureUser(ctx);
        const name = ctx.from?.first_name || 'User';
        await ctx.replyWithHTML(`🚀 <b>Welcome to ProxyBot, ${name}!</b>\n\n` +
            `Your premium residential proxy solution.\n\n` +
            `🔹 High-quality residential IPs\n` +
            `🔹 Multiple countries available\n` +
            `🔹 Custom username & password\n` +
            `🔹 Instant activation\n\n` +
            `Select an option below:`, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('🛒 Buy Proxy', 'buy')],
            [telegraf_1.Markup.button.callback('📦 My Assets', 'assets')],
            [telegraf_1.Markup.button.callback('👤 Profile', 'profile')],
            [telegraf_1.Markup.button.callback('💰 Add Balance', 'add_balance')],
        ]));
    }
    async onBuy(ctx) {
        await this.ensureUser(ctx);
        await ctx.replyWithHTML(`🛒 <b>Select Package Tier</b>\n\n` +
            `Choose your proxy quality level:`, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('🥉 Bronze - Budget', 'tier_bronze')],
            [telegraf_1.Markup.button.callback('🥈 Silver - Standard', 'tier_silver')],
            [telegraf_1.Markup.button.callback('🥇 Premium - Best Quality', 'tier_premium')],
            [telegraf_1.Markup.button.callback('⬅️ Back', 'start')],
        ]));
        if ('answerCbQuery' in ctx) {
            await ctx.answerCbQuery();
        }
    }
    async onTierSelect(ctx) {
        const match = ctx.match;
        const tier = match[1];
        const pkg = PACKAGES[tier];
        if (!pkg)
            return;
        await ctx.replyWithHTML(`${pkg.name} <b>Package</b>\n\n` +
            `Select duration:\n\n` +
            `📊 <b>Pricing:</b>\n` +
            `• 24 Hours: ৳${pkg.prices['24h']}\n` +
            `• 3 Days: ৳${pkg.prices['3d']}\n` +
            `• 7 Days: ৳${pkg.prices['7d']}\n` +
            `• 30 Days: ৳${pkg.prices['30d']}`, telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('24h', `dur_${tier}_24h`),
                telegraf_1.Markup.button.callback('3 Days', `dur_${tier}_3d`),
            ],
            [
                telegraf_1.Markup.button.callback('7 Days', `dur_${tier}_7d`),
                telegraf_1.Markup.button.callback('30 Days', `dur_${tier}_30d`),
            ],
            [telegraf_1.Markup.button.callback('⬅️ Back', 'buy')],
        ]));
        await ctx.answerCbQuery();
    }
    async onDurationSelect(ctx) {
        const match = ctx.match;
        const tier = match[1];
        const duration = match[2];
        const pkg = PACKAGES[tier];
        const price = pkg?.prices[duration];
        const hours = DURATIONS[duration];
        const user = await this.ensureUser(ctx);
        if (!user)
            return;
        if (Number(user.balance) < price) {
            await ctx.replyWithHTML(`❌ <b>Insufficient Balance</b>\n\n` +
                `Required: ৳${price}\n` +
                `Your Balance: ৳${user.balance}\n\n` +
                `Please add funds to continue.`, telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('💰 Add Balance', 'add_balance')],
                [telegraf_1.Markup.button.callback('⬅️ Back', 'buy')],
            ]));
            await ctx.answerCbQuery();
            return;
        }
        const availablePorts = await this.prisma.port.findMany({
            where: {
                isActive: true,
                currentUsers: { lt: this.prisma.port.fields.maxUsers },
            },
            take: 5,
        });
        if (availablePorts.length === 0) {
            await ctx.replyWithHTML(`❌ <b>No Available Ports</b>\n\n` +
                `All ports are currently at capacity. Please try again later.`, telegraf_1.Markup.inlineKeyboard([[telegraf_1.Markup.button.callback('⬅️ Back', 'buy')]]));
            await ctx.answerCbQuery();
            return;
        }
        const portButtons = availablePorts.map((port) => [
            telegraf_1.Markup.button.callback(`🌍 ${port.country} (${port.protocol}) - Port ${port.port}`, `port_${port.id}_${tier}_${duration}`),
        ]);
        await ctx.replyWithHTML(`🌐 <b>Select Country/Port</b>\n\n` +
            `${pkg.name} - ${duration}\n` +
            `Price: ৳${price}`, telegraf_1.Markup.inlineKeyboard([...portButtons, [telegraf_1.Markup.button.callback('⬅️ Back', 'buy')]]));
        await ctx.answerCbQuery();
    }
    async onProfile(ctx) {
        const user = await this.ensureUser(ctx);
        if (!user)
            return;
        const activeSessions = await this.sessionManager.getUserSessions(user.id);
        await ctx.replyWithHTML(`👤 <b>Your Profile</b>\n\n` +
            `🆔 ID: <code>${user.telegramId}</code>\n` +
            `💰 Balance: ৳${user.balance}\n` +
            `📦 Active Proxies: ${activeSessions.length}\n` +
            `📅 Joined: ${user.createdAt.toLocaleDateString()}`, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('💰 Add Balance', 'add_balance')],
            [telegraf_1.Markup.button.callback('📦 My Assets', 'assets')],
            [telegraf_1.Markup.button.callback('⬅️ Back to Menu', 'start')],
        ]));
        if ('answerCbQuery' in ctx) {
            await ctx.answerCbQuery();
        }
    }
    async onAssets(ctx) {
        const user = await this.ensureUser(ctx);
        if (!user)
            return;
        const sessions = await this.sessionManager.getUserSessions(user.id);
        if (sessions.length === 0) {
            await ctx.replyWithHTML(`📦 <b>My Assets</b>\n\n` +
                `You don't have any active proxies.\n\n` +
                `Buy a proxy to get started!`, telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('🛒 Buy Proxy', 'buy')],
                [telegraf_1.Markup.button.callback('⬅️ Back', 'start')],
            ]));
        }
        else {
            let message = `📦 <b>My Active Proxies</b>\n\n`;
            for (const session of sessions) {
                const expiresIn = Math.ceil((session.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));
                message +=
                    `🔹 <b>${session.port.country}</b> (${session.port.protocol})\n` +
                        `   Host: <code>${session.port.host}:${session.port.port}</code>\n` +
                        `   User: <code>${session.proxyUser}</code>\n` +
                        `   Pass: <code>${session.proxyPass}</code>\n` +
                        `   ⏰ Expires in: ${expiresIn}h\n\n`;
            }
            const sessionButtons = sessions.map((s) => [
                telegraf_1.Markup.button.callback(`🔄 Rotate IP #${s.id}`, `rotate_${s.id}`),
            ]);
            await ctx.replyWithHTML(message, telegraf_1.Markup.inlineKeyboard([...sessionButtons, [telegraf_1.Markup.button.callback('⬅️ Back', 'start')]]));
        }
        await ctx.answerCbQuery();
    }
    async onRotateIp(ctx) {
        const match = ctx.match;
        const sessionId = parseInt(match[1], 10);
        try {
            const result = await this.sessionManager.rotateIp(sessionId);
            await ctx.replyWithHTML(`✅ <b>IP Rotated Successfully!</b>\n\n` +
                `New Credentials:\n` +
                `User: <code>${result.username}</code>\n` +
                `Pass: <code>${result.password}</code>`, telegraf_1.Markup.inlineKeyboard([[telegraf_1.Markup.button.callback('📦 Back to Assets', 'assets')]]));
        }
        catch (error) {
            await ctx.replyWithHTML(`❌ <b>Rotation Failed</b>\n\n` +
                `Please wait a few minutes before rotating again.`, telegraf_1.Markup.inlineKeyboard([[telegraf_1.Markup.button.callback('📦 Back to Assets', 'assets')]]));
        }
        await ctx.answerCbQuery();
    }
    async onAddBalance(ctx) {
        const user = await this.ensureUser(ctx);
        if (!user)
            return;
        await ctx.replyWithHTML(`💰 <b>Add Balance</b>\n\n` +
            `Choose amount to add:`, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('৳100', 'pay_100')],
            [telegraf_1.Markup.button.callback('৳500', 'pay_500')],
            [telegraf_1.Markup.button.callback('৳1000', 'pay_1000')],
            [telegraf_1.Markup.button.callback('⬅️ Back', 'start')],
        ]));
        await ctx.answerCbQuery();
    }
    async onPayAmount(ctx) {
        const match = ctx.match;
        const amount = parseInt(match[1], 10);
        const user = await this.ensureUser(ctx);
        if (!user)
            return;
        try {
            await ctx.replyWithChatAction('typing');
            const fullName = [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(' ') || 'ProxyUser';
            const charge = await this.uddoktaPayService.createCharge(amount, fullName, 'no-email@example.com', { userId: user.id });
            await ctx.replyWithHTML(`💳 <b>Pamyent Link Generated</b>\n\n` +
                `Amount: ৳${amount}\n` +
                `Click the button below to pay via bKash/Nagad securely.`, telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.url('💸 Pay Now via UddoktaPay', charge.payment_url)],
                [telegraf_1.Markup.button.callback('⬅️ Cancel', 'add_balance')],
            ]));
        }
        catch (error) {
            this.logger.error(`Payment link gen failed: ${error.message}`);
            await ctx.reply(`❌ Failed to generate payment link. Please try again later.`);
        }
        await ctx.answerCbQuery();
    }
    async onBackToStart(ctx) {
        await this.onStart(ctx);
        await ctx.answerCbQuery();
    }
};
exports.BotUpdateService = BotUpdateService;
__decorate([
    (0, nestjs_telegraf_1.Action)(/port_(\d+)_(.+)_(.+)/),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdateService.prototype, "onPortSelect", null);
__decorate([
    (0, nestjs_telegraf_1.Start)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdateService.prototype, "onStart", null);
__decorate([
    (0, nestjs_telegraf_1.Command)('buy'),
    (0, nestjs_telegraf_1.Action)('buy'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdateService.prototype, "onBuy", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/tier_(.+)/),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdateService.prototype, "onTierSelect", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/dur_(.+)_(.+)/),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdateService.prototype, "onDurationSelect", null);
__decorate([
    (0, nestjs_telegraf_1.Command)('profile'),
    (0, nestjs_telegraf_1.Action)('profile'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdateService.prototype, "onProfile", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('assets'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdateService.prototype, "onAssets", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/rotate_(\d+)/),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdateService.prototype, "onRotateIp", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('add_balance'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdateService.prototype, "onAddBalance", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/pay_(\d+)/),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdateService.prototype, "onPayAmount", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('start'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdateService.prototype, "onBackToStart", null);
exports.BotUpdateService = BotUpdateService = BotUpdateService_1 = __decorate([
    (0, nestjs_telegraf_1.Update)(),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        session_manager_service_1.SessionManagerService,
        payment_service_1.PaymentService,
        uddoktapay_service_1.UddoktaPayService])
], BotUpdateService);
//# sourceMappingURL=bot-update.service.js.map