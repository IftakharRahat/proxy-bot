import { Injectable, Logger } from '@nestjs/common';
import { Update, Start, Command, Ctx, Action, On, Hears } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionManagerService } from '../../session-manager/session-manager.service';
import { PaymentService } from '../../payment/payment.service';
import { UddoktaPayService } from '../../payment/uddoktapay.service';

// Package tiers and pricing
const PACKAGES = {
    normal: { name: '🔹 Normal', prices: { '24h': 50, '3d': 120, '7d': 250, '30d': 800 } },
    medium: { name: '🔸 Medium', prices: { '24h': 80, '3d': 200, '7d': 400, '30d': 1200 } },
    high: { name: '🔥 High', prices: { '24h': 120, '3d': 300, '7d': 600, '30d': 1800 } },
};

const DURATIONS: Record<string, number> = {
    '24h': 24,
    '3d': 72,
    '7d': 168,
    '30d': 720,
};

@Update()
@Injectable()
export class BotUpdateService {
    private readonly logger = new Logger(BotUpdateService.name);

    constructor(
        private prisma: PrismaService,
        private sessionManager: SessionManagerService,
        private paymentService: PaymentService,
        private uddoktaPayService: UddoktaPayService,
    ) {
        console.log('!!! BotUpdateService CONSTRUCTOR CALLED !!!');
        this.logger.log('BotUpdateService initialized');
    }



    @Action(/port_(\d+)_(.+)_(.+)_(.+)/)
    async onPortSelect(@Ctx() ctx: Context) {
        const match = (ctx as any).match;
        const portId = parseInt(match[1], 10);
        const tier = match[2] as keyof typeof PACKAGES;
        const duration = match[3] as '24h' | '3d' | '7d' | '30d';
        const rotation = parseInt(match[4], 10);

        const pkg = PACKAGES[tier];
        const price = pkg?.prices[duration];
        const hours = DURATIONS[duration];

        if (!pkg || !price || !hours) return;

        const user = await this.ensureUser(ctx);
        if (!user) return;

        // Check balance again
        if (Number(user.balance) < price) {
            await ctx.replyWithHTML(`❌ <b>Insufficient Balance</b>`);
            await (ctx as any).answerCbQuery();
            return;
        }

        try {
            // Deduct balance
            await this.paymentService.deductBalance(user.id, price);

            // Create session
            const session = await this.sessionManager.createSession(
                user.id,
                portId,
                hours,
                rotation,
            );

            await ctx.replyWithHTML(
                `✅ <b>Purchase Successful!</b>\n\n` +
                `🌍 <b>${session.country} Proxy</b>\n` +
                `Host: <code>${session.host}:${session.port}</code>\n` +
                `User: <code>${session.username}</code>\n` +
                `Pass: <code>${session.password}</code>\n\n` +
                `Expires: ${session.expiresAt.toLocaleString()}\n\n` +
                `<i>You can verify this in "My Assets"</i>`,
                Markup.inlineKeyboard([
                    [Markup.button.callback('📦 My Assets', 'assets')],
                    [Markup.button.callback('⬅️ Back to Menu', 'start')],
                ])
            );

            this.logger.log(`User ${user.id} bought proxy on port ${portId} for ${price}`);

        } catch (error) {
            this.logger.error(`Purchase failed for user ${user.id}: ${error.message}`);
            // Refund if deduction happened? For now assume atomic or manual refund
            await ctx.replyWithHTML(`❌ <b>Purchase Failed</b>\n${error.message}`);
        }

        await (ctx as any).answerCbQuery();
    }

    // ... (rest of methods)


    /**
     * Ensure user exists in database
     */
    private async ensureUser(ctx: Context, referredById: number | null = null) {
        const telegramId = ctx.from?.id?.toString();
        if (!telegramId) return null;

        let user = await this.prisma.user.findUnique({
            where: { telegramId },
            include: { referrals: true, referredBy: true },
        });

        if (!user) {
            // Don't refer yourself
            const validReferredById = referredById && referredById !== 0 ? referredById : null;

            user = await this.prisma.user.create({
                data: {
                    telegramId,
                    username: ctx.from?.username || null,
                    referredById: validReferredById,
                },
                include: { referrals: true, referredBy: true },
            });
            this.logger.log(`New user created: ${telegramId}${referredById ? ` (Referred by: ${referredById})` : ''}`);
        }

        return user;
    }

    @Start()
    async onStart(@Ctx() ctx: Context) {
        this.logger.log(`Received /start command from ${ctx.from?.id}`);

        // Handle referral parameter: /start ref_123
        const startPayload = (ctx as any).startPayload; // Telegraf populates this
        let referredById: number | null = null;
        if (startPayload && startPayload.startsWith('ref_')) {
            referredById = parseInt(startPayload.split('_')[1], 10);
        }

        const user = await this.ensureUser(ctx, referredById);
        const name = ctx.from?.first_name || 'User';

        await ctx.replyWithHTML(
            `🚀 <b>Welcome to ProxyBot, ${name}!</b>\n\n` +
            `Your premium residential proxy solution.\n\n` +
            `🔹 High-quality residential IPs\n` +
            `🔹 Multiple countries available\n` +
            `🔹 Custom username & password\n` +
            `🔹 Instant activation\n\n` +
            `Select an option below:`,
            Markup.inlineKeyboard([
                [Markup.button.callback('🛒 Buy Proxy', 'buy')],
                [Markup.button.callback('📦 My Assets', 'assets')],
                [Markup.button.callback('👤 Profile', 'profile'), Markup.button.callback('👥 Referral', 'referral')],
                [Markup.button.callback('💰 Add Balance', 'add_balance')],
            ]),
        );
    }

    @Command('buy')
    @Action('buy')
    async onBuy(@Ctx() ctx: Context) {
        await this.ensureUser(ctx);

        // Show tier selection
        await ctx.replyWithHTML(
            `🛒 <b>Select Package Tier</b>\n\n` +
            `Choose your proxy quality level:`,
            Markup.inlineKeyboard([
                [Markup.button.callback('🔹 Normal - Budget', 'tier_normal')],
                [Markup.button.callback('🔸 Medium - Standard', 'tier_medium')],
                [Markup.button.callback('🔥 High - Best Quality', 'tier_high')],
                [Markup.button.callback('⬅️ Back', 'start')],
            ]),
        );

        // Answer callback if it's from button press
        if ('answerCbQuery' in ctx) {
            await (ctx as any).answerCbQuery();
        }
    }

    @Action(/tier_(.+)/)
    async onTierSelect(@Ctx() ctx: Context) {
        const match = (ctx as any).match;
        const tier = match[1] as keyof typeof PACKAGES;
        const pkg = PACKAGES[tier];

        if (!pkg) return;

        // Show duration selection with prices
        await ctx.replyWithHTML(
            `${pkg.name} <b>Package</b>\n\n` +
            `Select duration:\n\n` +
            `📊 <b>Pricing:</b>\n` +
            `• 24 Hours: ৳${pkg.prices['24h']}\n` +
            `• 3 Days: ৳${pkg.prices['3d']}\n` +
            `• 7 Days: ৳${pkg.prices['7d']}\n` +
            `• 30 Days: ৳${pkg.prices['30d']}`,
            Markup.inlineKeyboard([
                [
                    Markup.button.callback('24h', `dur_${tier}_24h`),
                    Markup.button.callback('3 Days', `dur_${tier}_3d`),
                ],
                [
                    Markup.button.callback('7 Days', `dur_${tier}_7d`),
                    Markup.button.callback('30 Days', `dur_${tier}_30d`),
                ],
                [Markup.button.callback('⬅️ Back', 'buy')],
            ]),
        );

        await (ctx as any).answerCbQuery();
    }

    @Action(/dur_(.+)_(.+)/)
    async onDurationSelect(@Ctx() ctx: Context) {
        const match = (ctx as any).match;
        const tier = match[1] as keyof typeof PACKAGES;
        const duration = match[2] as '24h' | '3d' | '7d' | '30d';
        const pkg = PACKAGES[tier];
        const price = pkg?.prices[duration];
        const hours = DURATIONS[duration];

        const user = await this.ensureUser(ctx);
        if (!user) return;

        // Check balance
        if (Number(user.balance) < price) {
            await ctx.replyWithHTML(
                `❌ <b>Insufficient Balance</b>\n\n` +
                `Required: ৳${price}\n` +
                `Your Balance: ৳${user.balance}\n\n` +
                `Please add funds to continue.`,
                Markup.inlineKeyboard([
                    [Markup.button.callback('💰 Add Balance', 'add_balance')],
                    [Markup.button.callback('⬅️ Back', 'buy')],
                ]),
            );
            await (ctx as any).answerCbQuery();
            return;
        }

        // High package users can select rotation period
        if (tier === 'high') {
            await ctx.replyWithHTML(
                `⏱ <b>Choose Rotation Period</b>\n\n` +
                `How often should your IP address change?`,
                Markup.inlineKeyboard([
                    [
                        Markup.button.callback('5 Mins', `rot_${tier}_${duration}_5`),
                        Markup.button.callback('10 Mins', `rot_${tier}_${duration}_10`),
                    ],
                    [
                        Markup.button.callback('30 Mins', `rot_${tier}_${duration}_30`),
                        Markup.button.callback('60 Mins', `rot_${tier}_${duration}_60`),
                    ],
                    [Markup.button.callback('⬅️ Back', `dur_${tier}_${duration}`)],
                ]),
            );
            await (ctx as any).answerCbQuery();
            return;
        }

        // Normal/Medium go straight to ports with 30m rotation
        await this.showPorts(ctx, tier, duration, 30);
    }

    @Action(/rot_(.+)_(.+)_(.+)/)
    async onRotationSelect(@Ctx() ctx: Context) {
        const match = (ctx as any).match;
        const tier = match[1] as keyof typeof PACKAGES;
        const duration = match[2] as '24h' | '3d' | '7d' | '30d';
        const rotation = parseInt(match[3], 10);

        await this.showPorts(ctx, tier, duration, rotation);
    }

    private async showPorts(ctx: Context, tier: string, duration: string, rotation: number) {
        const pkg = PACKAGES[tier as keyof typeof PACKAGES];
        const price = pkg?.prices[duration as '24h' | '3d' | '7d' | '30d'];

        // Show available ports for this tier (Filtered to US/Canada)
        const availablePorts = await this.prisma.port.findMany({
            where: {
                isActive: true,
                currentUsers: { lt: (this.prisma.port as any).fields.maxUsers }, // Cast to avoid IDE error if possible
                packageType: tier.charAt(0).toUpperCase() + tier.slice(1),
                country: { in: ['US', 'Canada'] },
            },
            take: 10,
        });

        if (availablePorts.length === 0) {
            await ctx.replyWithHTML(
                `❌ <b>No Available Ports</b>\n\n` +
                `All ports for ${tier} are currently at capacity. Please try again later.`,
                Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'buy')]]),
            );
            if ('answerCbQuery' in ctx) await (ctx as any).answerCbQuery();
            return;
        }

        const portButtons = availablePorts.map((port) => [
            Markup.button.callback(
                `🌍 ${port.country} (${port.protocol}) - Port ${port.port}`,
                `port_${port.id}_${tier}_${duration}_${rotation}`,
            ),
        ]);

        await ctx.replyWithHTML(
            `🌐 <b>Select Country/Port</b>\n\n` +
            `${pkg.name} - ${duration} (${rotation}m Rotation)\n` +
            `Price: ৳${price}`,
            Markup.inlineKeyboard([...portButtons, [Markup.button.callback('⬅️ Back', 'buy')]]),
        );

        if ('answerCbQuery' in ctx) await (ctx as any).answerCbQuery();
    }

    @Command('profile')
    @Action('profile')
    async onProfile(@Ctx() ctx: Context) {
        const user = await this.ensureUser(ctx);
        if (!user) return;

        const activeSessions = await this.sessionManager.getUserSessions(user.id);

        await ctx.replyWithHTML(
            `👤 <b>Your Profile</b>\n\n` +
            `🆔 ID: <code>${user.telegramId}</code>\n` +
            `💰 Balance: ৳${user.balance}\n` +
            `📦 Active Proxies: ${activeSessions.length}\n` +
            `📅 Joined: ${user.createdAt.toLocaleDateString()}`,
            Markup.inlineKeyboard([
                [Markup.button.callback('💰 Add Balance', 'add_balance')],
                [Markup.button.callback('📦 My Assets', 'assets')],
                [Markup.button.callback('⬅️ Back to Menu', 'start')],
            ]),
        );

        if ('answerCbQuery' in ctx) {
            await (ctx as any).answerCbQuery();
        }
    }

    @Action('assets')
    async onAssets(@Ctx() ctx: Context) {
        const user = await this.ensureUser(ctx);
        if (!user) return;

        const sessions = await this.sessionManager.getUserSessions(user.id);

        if (sessions.length === 0) {
            await ctx.replyWithHTML(
                `📦 <b>My Assets</b>\n\n` +
                `You don't have any active proxies.\n\n` +
                `Buy a proxy to get started!`,
                Markup.inlineKeyboard([
                    [Markup.button.callback('🛒 Buy Proxy', 'buy')],
                    [Markup.button.callback('⬅️ Back', 'start')],
                ]),
            );
        } else {
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
                Markup.button.callback(`🔄 Rotate IP #${s.id}`, `rotate_${s.id}`),
            ]);

            await ctx.replyWithHTML(
                message,
                Markup.inlineKeyboard([...sessionButtons, [Markup.button.callback('⬅️ Back', 'start')]]),
            );
        }

        await (ctx as any).answerCbQuery();
    }

    @Action(/rotate_(\d+)/)
    async onRotateIp(@Ctx() ctx: Context) {
        const match = (ctx as any).match;
        const sessionId = parseInt(match[1], 10);

        try {
            const result = await this.sessionManager.rotateIp(sessionId);
            await ctx.replyWithHTML(
                `✅ <b>IP Rotated Successfully!</b>\n\n` +
                `New Credentials:\n` +
                `User: <code>${result.username}</code>\n` +
                `Pass: <code>${result.password}</code>`,
                Markup.inlineKeyboard([[Markup.button.callback('📦 Back to Assets', 'assets')]]),
            );
        } catch (error) {
            await ctx.replyWithHTML(
                `❌ <b>Rotation Failed</b>\n\n` +
                `Please wait a few minutes before rotating again.`,
                Markup.inlineKeyboard([[Markup.button.callback('📦 Back to Assets', 'assets')]]),
            );
        }

        await (ctx as any).answerCbQuery();
    }

    @Action('add_balance')
    async onAddBalance(@Ctx() ctx: Context) {
        const user = await this.ensureUser(ctx);
        if (!user) return;

        await ctx.replyWithHTML(
            `💰 <b>Add Balance</b>\n\n` +
            `Choose amount to add:`,
            Markup.inlineKeyboard([
                [Markup.button.callback('৳100', 'pay_100')],
                [Markup.button.callback('৳500', 'pay_500')],
                [Markup.button.callback('৳1000', 'pay_1000')],
                [Markup.button.callback('⬅️ Back', 'start')],
            ]),
        );

        await (ctx as any).answerCbQuery();
    }

    @Action(/pay_(\d+)/)
    async onPayAmount(@Ctx() ctx: Context) {
        const match = (ctx as any).match;
        const amount = parseInt(match[1], 10);
        const user = await this.ensureUser(ctx);

        if (!user) return;

        try {
            await ctx.replyWithChatAction('typing');

            // Name from telegram
            const fullName = [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(' ') || 'ProxyUser';

            // Call PaymentService (which calls UddoktaPay)
            const charge = await this.uddoktaPayService.createCharge(
                amount,
                fullName,
                'no-email@example.com', // Optional email
                { userId: user.id }
            );

            await ctx.replyWithHTML(
                `💳 <b>Pamyent Link Generated</b>\n\n` +
                `Amount: ৳${amount}\n` +
                `Click the button below to pay via bKash/Nagad securely.`,
                Markup.inlineKeyboard([
                    [Markup.button.url('💸 Pay Now via UddoktaPay', charge.payment_url)],
                    [Markup.button.callback('⬅️ Cancel', 'add_balance')],
                ])
            );

        } catch (error) {
            this.logger.error(`Payment link gen failed: ${error.message}`);
            await ctx.reply(`❌ Failed to generate payment link. Please try again later.`);
        }

        await (ctx as any).answerCbQuery();
    }

    @Action('referral')
    @Command('referral')
    async onReferral(@Ctx() ctx: Context) {
        const user = await this.ensureUser(ctx);
        if (!user) return;

        const botUsername = (ctx as any).botInfo?.username || 'nov_proxy_bot'; // Fallback
        const refLink = `https://t.me/${botUsername}?start=ref_${user.id}`;

        const referralCount = await this.prisma.user.count({
            where: { referredById: user.id }
        });

        await ctx.replyWithHTML(
            `👥 <b>Referral Program</b>\n\n` +
            `Invite your friends and earn <b>10% commission</b> on every purchase they make!\n\n` +
            `📈 <b>Your Stats:</b>\n` +
            `• Total Referrals: <b>${referralCount}</b>\n` +
            `• Referral Earnings: <b>৳${user.referralEarnings}</b>\n\n` +
            `🔗 <b>Your Referral Link:</b>\n` +
            `<code>${refLink}</code>\n\n` +
            `<i>Earnings are automatically added to your balance.</i>`,
            Markup.inlineKeyboard([
                [Markup.button.callback('⬅️ Back to Menu', 'start')],
            ]),
        );

        if ('answerCbQuery' in ctx) {
            await (ctx as any).answerCbQuery();
        }
    }

    @Action('start')
    async onBackToStart(@Ctx() ctx: Context) {
        await this.onStart(ctx);
        await (ctx as any).answerCbQuery();
    }
}
