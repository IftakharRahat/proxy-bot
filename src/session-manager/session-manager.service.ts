import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NovproxyService } from '../novproxy/novproxy.service';
import { ProxyChainService } from '../proxy-chain/proxy-chain.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SessionManagerService {
    private readonly logger = new Logger(SessionManagerService.name);

    constructor(
        private prisma: PrismaService,
        private novproxy: NovproxyService,
        private proxyChain: ProxyChainService,
    ) { }

    /**
     * Generate a unique session string for the user
     */
    private generateSessionCredentials(userId: number, portId: number): { username: string; password: string } {
        const randomStr = Math.random().toString(36).substring(2, 10);
        const timestamp = Date.now().toString(36);
        return {
            username: `user${userId}_p${portId}_${randomStr}`,
            password: `pass_${timestamp}_${randomStr}`,
        };
    }

    /**
     * Create a new proxy session for a user
     */
    async createSession(
        userId: number,
        portId: number,
        durationHours: number,
        rotationPeriod: number = 30, // Default 30 mins
        purchasedTier?: string, // Added to promote port type
        customUser?: string,
        customPass?: string,
    ) {
        // Check if port exists and has available slots
        const port = await this.prisma.port.findUnique({
            where: { id: portId },
        });

        if (!port) {
            throw new BadRequestException('Port not found');
        }

        if (!port.isActive) {
            throw new BadRequestException('Port is not active');
        }

        if (port.currentUsers >= port.maxUsers) {
            throw new BadRequestException('Port is at maximum capacity');
        }

        // Check if user already has an active session on this port
        const existingSession = await this.prisma.proxySession.findFirst({
            where: {
                userId,
                portId,
                status: 'ACTIVE',
            },
        });

        if (existingSession) {
            throw new BadRequestException('User already has an active session on this port');
        }

        // Generate or use custom credentials
        const credentials = customUser && customPass
            ? { username: customUser, password: customPass }
            : this.generateSessionCredentials(userId, portId);

        // Calculate expiry
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + durationHours);

        // Create the session
        const session = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Increment port user count and update tier if provided
            const tierName = purchasedTier ? (purchasedTier.charAt(0).toUpperCase() + purchasedTier.slice(1)) : port.packageType;
            const maxUsers = tierName === 'High' ? 1 : 3;

            await tx.port.update({
                where: { id: portId },
                data: {
                    currentUsers: { increment: 1 },
                    packageType: tierName,
                    maxUsers: maxUsers
                },
            });

            // Create the session record
            return tx.proxySession.create({
                data: {
                    userId,
                    portId,
                    proxyUser: credentials.username,
                    proxyPass: credentials.password,
                    customUser: customUser || null,
                    customPass: customPass || null,
                    expiresAt,
                    rotationPeriod,
                    status: 'ACTIVE',
                },
                include: {
                    port: true,
                },
            });
        });

        // Sync credentials
        // Hybrid Logic:
        // A. High Tier (Dedicated) -> Direct Provider Sync
        // B. Normal/Medium (Shared) -> VPS 3proxy Sync
        // IMPORTANT: Use the NEWLY ASSIGNED tier (from purchasedTier), not the old port.packageType
        const effectiveTier = purchasedTier ? (purchasedTier.charAt(0).toUpperCase() + purchasedTier.slice(1)) : port.packageType;

        try {
            if (effectiveTier === 'High') {
                // Direct Sync with Novproxy - User gets DIRECT connection to residential provider
                await this.novproxy.batchEditPorts(
                    [portId],
                    {
                        username: session.proxyUser,
                        password: session.proxyPass,
                        region: session.port.country,
                        minute: session.rotationPeriod,
                    }
                );
                this.logger.log(`Direct Novproxy sync successful for Port ${portId} (Premium Tier)`);
            } else {
                // Shared Port -> Update Local VPS Config (with bandwidth limiting)
                // We do NOT change upstream credentials (batchEditPorts) because other users share it.
                // We just ensure the local proxy allows this new user.
                await this.proxyChain.rebuildConfig();
                this.logger.log(`VPS Proxy Chain updated for Port ${portId} (Shared Tier)`);
            }
        } catch (error) {
            this.logger.error(`Failed to sync proxy credentials for Port ${portId}: ${error.message}`);
        }

        this.logger.log(`Session created: User ${userId} -> Port ${portId}, expires ${expiresAt}`);

        // CRITICAL: Premium (High) tier users get DIRECT connection to Novproxy upstream
        // Shared (Normal/Medium) users go through VPS 3proxy chain
        if (effectiveTier === 'High' && session.port.upstreamHost && session.port.upstreamPort) {
            this.logger.log(`Premium user gets DIRECT Novproxy connection: ${session.port.upstreamHost}:${session.port.upstreamPort}`);
            return {
                sessionId: session.id,
                host: session.port.upstreamHost,     // Direct Novproxy IP
                port: session.port.upstreamPort,     // Direct Novproxy Port
                username: session.proxyUser,
                password: session.proxyPass,
                expiresAt: session.expiresAt,
                country: session.port.country,
                protocol: session.port.protocol,
            };
        }

        // Shared users go through VPS 3proxy chain (with bandwidth limiting)
        return {
            sessionId: session.id,
            host: session.port.host,
            port: session.port.localPort || session.port.port,
            username: session.proxyUser,
            password: session.proxyPass,
            expiresAt: session.expiresAt,
            country: session.port.country,
            protocol: session.port.protocol,
        };
    }

    /**
     * Expire a session (called by background job or manually)
     */
    async expireSession(sessionId: number) {
        const session = await this.prisma.proxySession.findUnique({
            where: { id: sessionId },
        });

        if (!session || session.status !== 'ACTIVE') {
            return null;
        }

        return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Decrement port user count
            await tx.port.update({
                where: { id: session.portId },
                data: { currentUsers: { decrement: 1 } },
            });

            // Mark session as expired
            return tx.proxySession.update({
                where: { id: sessionId },
                data: { status: 'EXPIRED' },
            });
        });
    }

    /**
     * Get all active sessions for a user
     */
    async getUserSessions(userId: number) {
        return this.prisma.proxySession.findMany({
            where: {
                userId,
                status: 'ACTIVE',
            },
            include: {
                port: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    /**
     * Rotate IP for a session (calls Novproxy batchEdit)
     */
    async rotateIp(sessionId: number) {
        const session = await this.prisma.proxySession.findUnique({
            where: { id: sessionId },
            include: { port: true },
        });

        if (!session || session.status !== 'ACTIVE') {
            throw new BadRequestException('Session not found or not active');
        }

        // Generate new credentials
        const newCredentials = this.generateSessionCredentials(session.userId, session.portId);

        try {
            // Only update upstream for Dedicated/High ports
            if (session.port.packageType === 'High') {
                await this.novproxy.batchEditPorts(
                    [session.portId],
                    {
                        username: newCredentials.username,
                        password: newCredentials.password,
                        region: session.port.country,
                        minute: session.rotationPeriod,
                    }
                );
                this.logger.log(`Novproxy sync successful for session ${sessionId}`);
            }

            // Update DB
            const updated = await this.prisma.proxySession.update({
                where: { id: sessionId },
                data: {
                    proxyUser: newCredentials.username,
                    proxyPass: newCredentials.password,
                    lastRotatedAt: new Date(),
                },
            });

            // Sync Local 3proxy Config (CRITICAL)
            if (session.port.packageType !== 'High') {
                await this.proxyChain.rebuildConfig();
                this.logger.log(`Local 3proxy config rebuilt for session ${sessionId}`);
            }

            this.logger.log(`IP rotated for session ${sessionId}`);

            return {
                sessionId: updated.id,
                username: updated.proxyUser,
                password: updated.proxyPass,
                lastRotatedAt: updated.lastRotatedAt,
            };
        } catch (error) {
            this.logger.error(`Failed to rotate IP: ${error.message}`);
            throw error;
        }
    }

    /**
     * Check and expire all sessions that have passed their expiry time
     */
    async expireAllExpiredSessions() {
        const expiredSessions = await this.prisma.proxySession.findMany({
            where: {
                status: 'ACTIVE',
                expiresAt: { lte: new Date() },
            },
        });

        let expiredCount = 0;
        for (const session of expiredSessions) {
            await this.expireSession(session.id);
            expiredCount++;
        }

        if (expiredCount > 0) {
            this.logger.log(`Expired ${expiredCount} sessions`);
        }

        return expiredCount;
    }
}
