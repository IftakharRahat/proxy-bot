import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SessionManagerService } from '../session-manager/session-manager.service';

@Injectable()
export class RotationService implements OnModuleInit {
    private readonly logger = new Logger(RotationService.name);

    constructor(
        private prisma: PrismaService,
        private sessionManager: SessionManagerService,
    ) { }

    onModuleInit() {
        this.logger.log('Rotation Service initialized');
    }

    /**
     * Run every minute to check if any IPs need rotation
     * DISABLED: User requested no rotating system.
     */
    // @Cron(CronExpression.EVERY_MINUTE)
    async handleRotation() {
        // Find all active sessions where (lastRotatedAt + rotationPeriod) <= now
        // If lastRotatedAt is null, use createdAt
        const now = new Date();

        // Using raw query or findMany with logic
        const sessions = await this.prisma.proxySession.findMany({
            where: {
                status: 'ACTIVE',
            },
            include: {
                port: true,
            },
        });

        let rotatedCount = 0;

        for (const session of sessions) {
            const baseTime = session.lastRotatedAt || session.createdAt;
            const diffMins = Math.floor((now.getTime() - baseTime.getTime()) / (1000 * 60));

            if (diffMins >= session.rotationPeriod) {
                try {
                    await this.sessionManager.rotateIp(session.id);
                    rotatedCount++;
                } catch (err) {
                    this.logger.error(`Failed to rotate session ${session.id}: ${err.message}`);
                }
            }
        }

        if (rotatedCount > 0) {
            this.logger.log(`Auto-rotated ${rotatedCount} sessions`);
        }
    }
}
