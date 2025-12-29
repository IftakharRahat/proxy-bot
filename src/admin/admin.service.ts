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

    async manualRefill(packageType: string, duration: string, quantity: number) {
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

                return { success: true, msg: 'Refill successful', data: res.data };
            } else {
                throw new Error(res.msg || 'Novproxy API Error');
            }
        } catch (error) {
            logger.error(`Refill failed: ${error.message}`);
            return { success: false, msg: error.message };
        }
    }
}
