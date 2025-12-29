import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { SessionManagerService } from '../../session-manager/session-manager.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Processor('session-expiry')
@Injectable()
export class ExpiryProcessorService extends WorkerHost implements OnModuleInit {
    private readonly logger = new Logger(ExpiryProcessorService.name);

    constructor(
        private sessionManager: SessionManagerService,
        @InjectQueue('session-expiry') private expiryQueue: Queue,
    ) {
        super();
    }

    async onModuleInit() {
        this.logger.log('Expiry Processor initialized');
        // Run initial cleanup on startup
        await this.cleanupExpiredSessions();
    }

    /**
     * Process individual session expiry jobs
     */
    async process(job: Job<{ sessionId: number }>): Promise<void> {
        const { sessionId } = job.data;
        this.logger.log(`Processing expiry for session ${sessionId}`);

        try {
            await this.sessionManager.expireSession(sessionId);
            this.logger.log(`Session ${sessionId} expired successfully`);
        } catch (error) {
            this.logger.error(`Failed to expire session ${sessionId}:`, error);
            throw error;
        }
    }

    /**
     * Schedule a session expiry job
     */
    async scheduleExpiry(sessionId: number, expiresAt: Date): Promise<void> {
        const delay = expiresAt.getTime() - Date.now();

        if (delay <= 0) {
            // Already expired, process immediately
            await this.sessionManager.expireSession(sessionId);
            return;
        }

        await this.expiryQueue.add(
            'expire-session',
            { sessionId },
            {
                delay,
                removeOnComplete: true,
                removeOnFail: false,
                jobId: `session-${sessionId}`,
            },
        );

        this.logger.log(`Scheduled expiry for session ${sessionId} in ${Math.round(delay / 1000 / 60)} minutes`);
    }

    /**
     * Run every minute to clean up any sessions that may have been missed
     */
    async cleanupExpiredSessions(): Promise<void> {
        try {
            const expiredCount = await this.sessionManager.expireAllExpiredSessions();
            if (expiredCount > 0) {
                this.logger.log(`Cleaned up ${expiredCount} expired sessions`);
            }
        } catch (error) {
            this.logger.error('Failed to cleanup expired sessions:', error);
        }
    }
}
