"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const config_1 = require("@nestjs/config");
const expiry_processor_service_1 = require("./expiry-processor/expiry-processor.service");
const session_manager_service_1 = require("../session-manager/session-manager.service");
const novproxy_service_1 = require("../novproxy/novproxy.service");
let QueueModule = class QueueModule {
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    connection: {
                        host: configService.get('REDIS_HOST'),
                        port: parseInt(configService.get('REDIS_PORT') || '6379', 10),
                        password: configService.get('REDIS_PASSWORD'),
                        tls: {},
                    },
                }),
            }),
            bullmq_1.BullModule.registerQueue({
                name: 'session-expiry',
            }),
            bullmq_1.BullModule.registerQueue({
                name: 'rotation-cooldown',
            }),
        ],
        providers: [expiry_processor_service_1.ExpiryProcessorService, session_manager_service_1.SessionManagerService, novproxy_service_1.NovproxyService],
        exports: [bullmq_1.BullModule],
    })
], QueueModule);
//# sourceMappingURL=queue.module.js.map