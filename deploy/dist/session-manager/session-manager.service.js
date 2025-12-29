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
var SessionManagerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManagerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const novproxy_service_1 = require("../novproxy/novproxy.service");
let SessionManagerService = SessionManagerService_1 = class SessionManagerService {
    prisma;
    novproxy;
    logger = new common_1.Logger(SessionManagerService_1.name);
    constructor(prisma, novproxy) {
        this.prisma = prisma;
        this.novproxy = novproxy;
    }
    generateSessionCredentials(userId, portId) {
        const randomStr = Math.random().toString(36).substring(2, 10);
        const timestamp = Date.now().toString(36);
        return {
            username: `user${userId}_p${portId}_${randomStr}`,
            password: `pass_${timestamp}_${randomStr}`,
        };
    }
    async createSession(userId, portId, durationHours, customUser, customPass) {
        const port = await this.prisma.port.findUnique({
            where: { id: portId },
        });
        if (!port) {
            throw new common_1.BadRequestException('Port not found');
        }
        if (!port.isActive) {
            throw new common_1.BadRequestException('Port is not active');
        }
        if (port.currentUsers >= port.maxUsers) {
            throw new common_1.BadRequestException('Port is at maximum capacity');
        }
        const existingSession = await this.prisma.proxySession.findFirst({
            where: {
                userId,
                portId,
                status: 'ACTIVE',
            },
        });
        if (existingSession) {
            throw new common_1.BadRequestException('User already has an active session on this port');
        }
        const credentials = customUser && customPass
            ? { username: customUser, password: customPass }
            : this.generateSessionCredentials(userId, portId);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + durationHours);
        const session = await this.prisma.$transaction(async (tx) => {
            await tx.port.update({
                where: { id: portId },
                data: { currentUsers: { increment: 1 } },
            });
            return tx.proxySession.create({
                data: {
                    userId,
                    portId,
                    proxyUser: credentials.username,
                    proxyPass: credentials.password,
                    customUser: customUser || null,
                    customPass: customPass || null,
                    expiresAt,
                    status: 'ACTIVE',
                },
                include: {
                    port: true,
                },
            });
        });
        this.logger.log(`Session created: User ${userId} -> Port ${portId}, expires ${expiresAt}`);
        return {
            sessionId: session.id,
            host: session.port.host,
            port: session.port.port,
            username: session.proxyUser,
            password: session.proxyPass,
            expiresAt: session.expiresAt,
            country: session.port.country,
            protocol: session.port.protocol,
        };
    }
    async expireSession(sessionId) {
        const session = await this.prisma.proxySession.findUnique({
            where: { id: sessionId },
        });
        if (!session || session.status !== 'ACTIVE') {
            return null;
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.port.update({
                where: { id: session.portId },
                data: { currentUsers: { decrement: 1 } },
            });
            return tx.proxySession.update({
                where: { id: sessionId },
                data: { status: 'EXPIRED' },
            });
        });
    }
    async getUserSessions(userId) {
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
    async rotateIp(sessionId) {
        const session = await this.prisma.proxySession.findUnique({
            where: { id: sessionId },
            include: { port: true },
        });
        if (!session || session.status !== 'ACTIVE') {
            throw new common_1.BadRequestException('Session not found or not active');
        }
        const newCredentials = this.generateSessionCredentials(session.userId, session.portId);
        const updated = await this.prisma.proxySession.update({
            where: { id: sessionId },
            data: {
                proxyUser: newCredentials.username,
                proxyPass: newCredentials.password,
                lastRotatedAt: new Date(),
            },
        });
        this.logger.log(`IP rotated for session ${sessionId}`);
        return {
            sessionId: updated.id,
            username: updated.proxyUser,
            password: updated.proxyPass,
            lastRotatedAt: updated.lastRotatedAt,
        };
    }
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
};
exports.SessionManagerService = SessionManagerService;
exports.SessionManagerService = SessionManagerService = SessionManagerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        novproxy_service_1.NovproxyService])
], SessionManagerService);
//# sourceMappingURL=session-manager.service.js.map