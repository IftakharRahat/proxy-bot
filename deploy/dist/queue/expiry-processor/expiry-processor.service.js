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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ExpiryProcessorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpiryProcessorService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const session_manager_service_1 = require("../../session-manager/session-manager.service");
let ExpiryProcessorService = ExpiryProcessorService_1 = class ExpiryProcessorService extends bullmq_1.WorkerHost {
    sessionManager;
    expiryQueue;
    logger = new common_1.Logger(ExpiryProcessorService_1.name);
    constructor(sessionManager, expiryQueue) {
        super();
        this.sessionManager = sessionManager;
        this.expiryQueue = expiryQueue;
    }
    async onModuleInit() {
        this.logger.log('Expiry Processor initialized');
        await this.cleanupExpiredSessions();
    }
    async process(job) {
        const { sessionId } = job.data;
        this.logger.log(`Processing expiry for session ${sessionId}`);
        try {
            await this.sessionManager.expireSession(sessionId);
            this.logger.log(`Session ${sessionId} expired successfully`);
        }
        catch (error) {
            this.logger.error(`Failed to expire session ${sessionId}:`, error);
            throw error;
        }
    }
    async scheduleExpiry(sessionId, expiresAt) {
        const delay = expiresAt.getTime() - Date.now();
        if (delay <= 0) {
            await this.sessionManager.expireSession(sessionId);
            return;
        }
        await this.expiryQueue.add('expire-session', { sessionId }, {
            delay,
            removeOnComplete: true,
            removeOnFail: false,
            jobId: `session-${sessionId}`,
        });
        this.logger.log(`Scheduled expiry for session ${sessionId} in ${Math.round(delay / 1000 / 60)} minutes`);
    }
    async cleanupExpiredSessions() {
        try {
            const expiredCount = await this.sessionManager.expireAllExpiredSessions();
            if (expiredCount > 0) {
                this.logger.log(`Cleaned up ${expiredCount} expired sessions`);
            }
        }
        catch (error) {
            this.logger.error('Failed to cleanup expired sessions:', error);
        }
    }
};
exports.ExpiryProcessorService = ExpiryProcessorService;
exports.ExpiryProcessorService = ExpiryProcessorService = ExpiryProcessorService_1 = __decorate([
    (0, bullmq_1.Processor)('session-expiry'),
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)('session-expiry')),
    __metadata("design:paramtypes", [session_manager_service_1.SessionManagerService,
        bullmq_2.Queue])
], ExpiryProcessorService);
//# sourceMappingURL=expiry-processor.service.js.map