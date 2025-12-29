import { OnModuleInit } from '@nestjs/common';
import { WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { SessionManagerService } from '../../session-manager/session-manager.service';
export declare class ExpiryProcessorService extends WorkerHost implements OnModuleInit {
    private sessionManager;
    private expiryQueue;
    private readonly logger;
    constructor(sessionManager: SessionManagerService, expiryQueue: Queue);
    onModuleInit(): Promise<void>;
    process(job: Job<{
        sessionId: number;
    }>): Promise<void>;
    scheduleExpiry(sessionId: number, expiresAt: Date): Promise<void>;
    cleanupExpiredSessions(): Promise<void>;
}
