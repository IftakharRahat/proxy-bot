import { PrismaService } from '../prisma/prisma.service';
import { NovproxyService } from '../novproxy/novproxy.service';
export declare class SessionManagerService {
    private prisma;
    private novproxy;
    private readonly logger;
    constructor(prisma: PrismaService, novproxy: NovproxyService);
    private generateSessionCredentials;
    createSession(userId: number, portId: number, durationHours: number, customUser?: string, customPass?: string): Promise<{
        sessionId: number;
        host: string;
        port: number;
        username: string;
        password: string;
        expiresAt: Date;
        country: string;
        protocol: import(".prisma/client").$Enums.PortProtocol;
    }>;
    expireSession(sessionId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        portId: number;
        proxyUser: string;
        proxyPass: string;
        customUser: string | null;
        customPass: string | null;
        status: import(".prisma/client").$Enums.SessionStatus;
        expiresAt: Date;
        lastRotatedAt: Date | null;
    } | null>;
    getUserSessions(userId: number): Promise<({
        port: {
            port: number;
            id: number;
            host: string;
            protocol: import(".prisma/client").$Enums.PortProtocol;
            country: string;
            maxUsers: number;
            currentUsers: number;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        portId: number;
        proxyUser: string;
        proxyPass: string;
        customUser: string | null;
        customPass: string | null;
        status: import(".prisma/client").$Enums.SessionStatus;
        expiresAt: Date;
        lastRotatedAt: Date | null;
    })[]>;
    rotateIp(sessionId: number): Promise<{
        sessionId: number;
        username: string;
        password: string;
        lastRotatedAt: Date | null;
    }>;
    expireAllExpiredSessions(): Promise<number>;
}
