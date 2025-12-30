import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NovproxyService } from '../novproxy/novproxy.service';

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private novproxyService: NovproxyService,
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
                const cost = res.data?.value || (quantity * (duration === '30 Days' ? 0.8 : duration === '7 Days' ? 0.9 : 1.0));

                await this.createPurchaseLog({
                    packageType,
                    duration,
                    cost: Number(cost),
                    orderId: res.data?.order_id?.toString(),
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
                    for (const port of portList.data.list) {
                        await this.prisma.port.upsert({
                            where: { id: port.id },
                            create: {
                                id: port.id,
                                host: port.ip,
                                port: port.port,
                                country: country,
                                protocol: 'HTTP',
                                packageType: packageType,
                                maxUsers: packageType === 'High' ? 1 : packageType === 'Medium' ? 3 : 5,
                                isActive: true,
                            },
                            update: {
                                host: port.ip,
                                port: port.port,
                                country: country,
                                isActive: true,
                            },
                        });
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
        const unitPrice = await this.novproxyService.getEstimatedUnitPrice();

        let tierMultiplier = 1.0;
        if (tier === 'Medium') tierMultiplier = 1.5;
        if (tier === 'High') tierMultiplier = 2.5;

        let durationMultiplier = 1.0;
        if (duration === '7 Days') durationMultiplier = 6.0;
        if (duration === '30 Days') durationMultiplier = 20.0;

        const totalCost = Number((quantity * unitPrice * tierMultiplier * durationMultiplier).toFixed(2));

        return {
            unitPrice,
            totalCost,
            currency: 'USD',
            isEstimated: true,
        };
    }
}
