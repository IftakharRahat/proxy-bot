import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NovproxyService } from '../novproxy/novproxy.service';
import { ProxyChainService } from '../proxy-chain/proxy-chain.service';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private novproxyService: NovproxyService,
        private proxyChain: ProxyChainService,
        private configService: ConfigService,
    ) { }

    async getAllUsers() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                telegramId: true,
                username: true,
                balance: true,
                createdAt: true,
                _count: {
                    select: { sessions: true, transactions: true },
                },
            },
        });
    }

    async getAllProxies() {
        return this.prisma.proxySession.findMany({
            where: {
                status: 'ACTIVE',
            },
            include: {
                user: {
                    select: { username: true, telegramId: true },
                },
                port: {
                    select: {
                        id: true,
                        host: true,
                        port: true,
                        protocol: true,
                        country: true,
                        currentUsers: true,
                        maxUsers: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getPackageConfigs() {
        const configs = await this.prisma.packageConfig.findMany();
        if (configs.length === 0) {
            // Seed defaults if empty
            await this.prisma.packageConfig.createMany({
                data: [
                    { name: 'Normal', maxUsers: 5, autoBuyEnabled: false },
                    { name: 'Medium', maxUsers: 3, autoBuyEnabled: false },
                    { name: 'High', maxUsers: 1, autoBuyEnabled: false },
                ],
            });
            return this.prisma.packageConfig.findMany();
        }
        return configs;
    }

    async updatePackageConfig(name: string, data: { maxUsers?: number; autoBuyEnabled?: boolean; autoBuyDuration?: string }) {
        return this.prisma.packageConfig.update({
            where: { name },
            data,
        });
    }

    async getPurchaseLogs() {
        return this.prisma.purchaseLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100,
        });
    }

    async createPurchaseLog(data: { packageType: string; duration: string; cost: number; orderId?: string }) {
        return this.prisma.purchaseLog.create({
            data: {
                packageType: data.packageType,
                duration: data.duration,
                cost: Number(data.cost),
                orderId: data.orderId,
            },
        });
    }

    async changeCountry(sessionId: number, newCountry: string) {
        // 1. Find the session
        const session = await this.prisma.proxySession.findUnique({
            where: { id: sessionId },
            include: { port: true },
        });

        if (!session) throw new Error('Session not found');

        // 2. Find a new port in the target country
        const newPort = await this.prisma.port.findFirst({
            where: {
                country: newCountry,
                isActive: true,
                currentUsers: { lt: (this.prisma.port as any).fields.maxUsers },
                packageType: session.port.packageType,
            },
        });

        if (!newPort) throw new Error(`No available ports in ${newCountry} for this package`);

        // 3. Update the session
        await this.prisma.$transaction(async (tx) => {
            // Decrement old port users
            await tx.port.update({
                where: { id: session.portId },
                data: { currentUsers: { decrement: 1 } },
            });

            // Increment new port users
            await tx.port.update({
                where: { id: newPort.id },
                data: { currentUsers: { increment: 1 } },
            });

            // Update session
            await tx.proxySession.update({
                where: { id: sessionId },
                data: { portId: newPort.id },
            });
        });

        // 4. Sync with Novproxy
        try {
            await this.novproxyService.batchEditPorts(
                [newPort.id],
                {
                    username: session.proxyUser,
                    password: session.proxyPass,
                    region: newPort.country,
                    minute: session.rotationPeriod,
                }
            );
        } catch (error) {
            console.error(`Failed to sync with Novproxy after country change: ${error.message}`);
        }

        return { success: true, port: newPort };
    }

    async manualRefill(
        packageType: string,
        duration: string,
        quantity: number,
        country: string = 'Random',
        rotation: number = 30
    ) {
        const logger = new Logger('AdminService:Refill');

        const durationMap: Record<string, number> = {
            '1 Day': 1,
            '7 Days': 7,
            '30 Days': 30,
        };
        const days = durationMap[duration] || 1;

        try {
            const res = await this.novproxyService.buyPort(days, quantity);

            if (res.code === 0) {
                const orderId = res.data?.order_id || res.data?.id;
                let cost = 0;

                // Fetch real cost from order history
                try {
                    const orders = await this.novproxyService.getOrderList(1, 20);
                    if (orders.code === 0 && orders.data) {
                        const matchedOrder = orders.data.find(o => o.id.toString() === orderId?.toString());
                        if (matchedOrder) {
                            cost = matchedOrder.value;
                            logger.log(`Confirmed real cost from Novproxy: $${cost} for Order #${orderId}`);
                        }
                    }
                } catch (e) {
                    logger.warn(`Could not fetch real cost for order ${orderId}, using fallback.`);
                    // Fallback to estimation or 0 if critical
                    cost = res.data?.value || (quantity * (duration === '30 Days' ? 0.8 : duration === '7 Days' ? 0.9 : 1.0)); // Fallback
                }

                if (cost === 0) cost = res.data?.value || 0;

                await this.createPurchaseLog({
                    packageType,
                    duration,
                    cost: Number(cost),
                    orderId: orderId?.toString(),
                });

                // --- Sync Ports immediately after purchase ---
                logger.log(`Purchase successful (Order: ${res.data?.order_id}). Syncing ports...`);
                const portList = await this.novproxyService.getPortsList(1, 100, res.data?.order_id?.toString());

                if (portList.code === 0 && portList.data?.list) {
                    const portIds = portList.data.list.map(p => p.id);

                    // Apply country and rotation settings via batch_edit
                    if (portIds.length > 0) {
                        logger.log(`Applying settings: Country=${country}, Rotation=${rotation}min to ${portIds.length} ports`);
                        await this.novproxyService.batchEditPorts(portIds, {
                            username: portList.data.list[0]?.username || 'proxyuser',
                            password: portList.data.list[0]?.password || 'proxypass',
                            region: country,
                            minute: rotation,
                        });
                    }

                    // Save to local database
                    // For Shared (Normal/Medium), we need to assign local ports on VPS
                    let nextLocalPort = 30000;
                    if (packageType !== 'High') {
                        const lastPort = await this.prisma.port.findFirst({
                            where: { localPort: { not: null } },
                            orderBy: { localPort: 'desc' },
                        });
                        if (lastPort?.localPort) nextLocalPort = lastPort.localPort + 1;
                    }

                    const vpsIp = this.configService.get('VPS_IP') || '127.0.0.1'; // Update this in .env

                    for (const port of portList.data.list) {
                        let localPortVal: number | null = null;

                        // Default to Direct Provider Info
                        let finalHost = port.ip;
                        let finalPort = port.port;
                        let upHost: string | null = null;
                        let upPort: number | null = null;
                        let upUser: string | null = null;
                        let upPass: string | null = null;

                        if (packageType !== 'High') {
                            // Shared: Use VPS Info
                            localPortVal = nextLocalPort++;
                            finalHost = vpsIp;
                            finalPort = localPortVal;

                            // Save Upstream Info
                            upHost = port.ip;
                            upPort = port.port;
                            upUser = port.username;
                            upPass = port.password;
                        }

                        await this.prisma.port.upsert({
                            where: { id: port.id },
                            create: {
                                id: port.id,
                                host: finalHost,
                                port: finalPort,
                                country: country,
                                protocol: 'HTTP',
                                packageType: packageType,
                                maxUsers: packageType === 'High' ? 1 : packageType === 'Medium' ? 3 : 5,
                                isActive: true,
                                // Hybrid Fields
                                localPort: localPortVal,
                                upstreamHost: upHost,
                                upstreamPort: upPort,
                                upstreamUser: upUser,
                                upstreamPass: upPass,
                            },
                            update: {
                                host: finalHost,
                                port: finalPort,
                                country: country,
                                isActive: true,
                                localPort: localPortVal, // Update if re-refilling/resetting
                                upstreamHost: upHost,
                                upstreamPort: upPort, // Ensure upstream info is also updated
                                upstreamUser: upUser,
                                upstreamPass: upPass,
                            },
                        });
                    }

                    // If shared ports added, rebuild proxy config
                    if (packageType !== 'High') {
                        await this.proxyChain.rebuildConfig();
                    }
                }

                return { success: true, msg: `Refill successful. ${quantity} ports (${country}, ${rotation}m) added to ${packageType} pool.`, data: res.data };
            } else {
                throw new Error(res.msg || 'Novproxy API Error');
            }
        } catch (error) {
            logger.error(`Refill failed: ${error.message}`);
            return { success: false, msg: error.message };
        }
    }

    async getProcurementEstimate(tier: string, duration: string, quantity: number) {
        // Fetch REAL pricing from user's Novproxy order history
        // This reflects the actual account plan/rates, not website prices
        const pricing = await this.novproxyService.getEstimatedUnitPrice();

        // Duration in days
        const daysMap: Record<string, number> = {
            '1 Day': 1,
            '7 Days': 7,
            '30 Days': 30,
        };
        const days = daysMap[duration] || 1;

        // The pricePerPort from history is for 30 days (most recent order)
        // Scale proportionally for other durations
        const priceFor30Days = pricing.pricePerPort;
        const pricePerDay = priceFor30Days / 30;
        const unitPrice = Number((pricePerDay * days).toFixed(2));
        const totalCost = Number((quantity * unitPrice).toFixed(2));

        return {
            unitPrice,
            totalCost,
            currency: 'USD',
            isEstimated: pricing.source.includes('Default'),
            source: pricing.source,
            perDayRate: Number(pricePerDay.toFixed(4)),
            days,
        };
    }

    // ========== BOT PRICING CONFIGURATION ==========

    async getBotPricing() {
        const pricing = await this.prisma.botPricing.findMany({
            orderBy: [{ tier: 'asc' }, { duration: 'asc' }],
        });

        // If no pricing exists, seed defaults
        if (pricing.length === 0) {
            await this.seedDefaultBotPricing();
            return this.prisma.botPricing.findMany({
                orderBy: [{ tier: 'asc' }, { duration: 'asc' }],
            });
        }

        return pricing;
    }

    async updateBotPricing(tier: string, duration: string, price: number) {
        return this.prisma.botPricing.upsert({
            where: { tier_duration: { tier, duration } },
            create: { tier, duration, price, currency: 'BDT' },
            update: { price },
        });
    }

    async updateAllBotPricing(prices: { tier: string; duration: string; price: number }[]) {
        const updates = prices.map(p =>
            this.prisma.botPricing.upsert({
                where: { tier_duration: { tier: p.tier, duration: p.duration } },
                create: { tier: p.tier, duration: p.duration, price: p.price, currency: 'BDT' },
                update: { price: p.price },
            })
        );
        await this.prisma.$transaction(updates);
        return { success: true, message: 'All prices updated successfully' };
    }

    private async seedDefaultBotPricing() {
        const defaults = [
            // Normal tier
            { tier: 'Normal', duration: '24h', price: 50 },
            { tier: 'Normal', duration: '3d', price: 120 },
            { tier: 'Normal', duration: '7d', price: 250 },
            { tier: 'Normal', duration: '30d', price: 800 },
            // Medium tier
            { tier: 'Medium', duration: '24h', price: 80 },
            { tier: 'Medium', duration: '3d', price: 200 },
            { tier: 'Medium', duration: '7d', price: 400 },
            { tier: 'Medium', duration: '30d', price: 1200 },
            // High tier
            { tier: 'High', duration: '24h', price: 120 },
            { tier: 'High', duration: '3d', price: 300 },
            { tier: 'High', duration: '7d', price: 600 },
            { tier: 'High', duration: '30d', price: 1800 },
        ];

        for (const d of defaults) {
            await this.prisma.botPricing.upsert({
                where: { tier_duration: { tier: d.tier, duration: d.duration } },
                create: { tier: d.tier, duration: d.duration, price: d.price, currency: 'BDT' },
                update: {},
            });
        }
    }

    // ========== MANUAL BALANCE MANAGEMENT ==========

    async addBalance(userId: number, amount: number) {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id: userId },
                data: { balance: { increment: amount } },
            });

            const trxId = `MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            await tx.transaction.create({
                data: {
                    userId,
                    amount: amount,
                    currency: 'BDT',
                    gateway: 'MANUAL',
                    trxId: trxId,
                    status: 'COMPLETED',
                },
            });

            return { success: true, newBalance: user.balance, trxId };
        });
    }

    // ========== BALANCE PRESETS (BOT BUTTONS) ==========

    async getBalancePresets() {
        const presets = await this.prisma.balancePreset.findMany({
            orderBy: { displayOrder: 'asc' },
        });

        if (presets.length === 0) {
            await this.seedDefaultBalancePresets();
            return this.prisma.balancePreset.findMany({
                orderBy: { displayOrder: 'asc' },
            });
        }
        return presets;
    }

    async addBalancePreset(amount: number) {
        const label = `৳${amount}`;
        return this.prisma.balancePreset.create({
            data: {
                amount,
                label,
                displayOrder: amount,
            },
        });
    }

    async deleteBalancePreset(id: number) {
        return this.prisma.balancePreset.delete({
            where: { id },
        });
    }

    private async seedDefaultBalancePresets() {
        const defaults = [10, 50, 100, 500, 1000];
        for (const amt of defaults) {
            await this.prisma.balancePreset.upsert({
                where: { amount: amt },
                create: { amount: amt, label: `৳${amt}`, displayOrder: amt },
                update: {},
            });
        }
    }
}
