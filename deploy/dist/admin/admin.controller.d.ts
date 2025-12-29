import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getUsers(): Promise<{
        id: number;
        username: string | null;
        createdAt: Date;
        telegramId: string;
        balance: import("@prisma/client/runtime/library").Decimal;
        _count: {
            sessions: number;
            transactions: number;
        };
    }[]>;
    getProxies(): Promise<({
        user: {
            username: string | null;
            telegramId: string;
        };
        port: {
            port: number;
            host: string;
            protocol: import(".prisma/client").$Enums.PortProtocol;
            country: string;
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
}
