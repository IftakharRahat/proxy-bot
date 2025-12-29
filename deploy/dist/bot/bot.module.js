"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotModule = void 0;
const common_1 = require("@nestjs/common");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const config_1 = require("@nestjs/config");
const bot_update_service_1 = require("./bot-update/bot-update.service");
const novproxy_module_1 = require("../novproxy/novproxy.module");
const session_manager_module_1 = require("../session-manager/session-manager.module");
const payment_module_1 = require("../payment/payment.module");
let BotModule = class BotModule {
};
exports.BotModule = BotModule;
exports.BotModule = BotModule = __decorate([
    (0, common_1.Module)({
        imports: [
            nestjs_telegraf_1.TelegrafModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    token: configService.get('TELEGRAM_BOT_TOKEN') || '',
                    launchOptions: {
                        webhook: undefined,
                    },
                }),
            }),
            session_manager_module_1.SessionManagerModule,
            novproxy_module_1.NovproxyModule,
            payment_module_1.PaymentModule,
        ],
        providers: [bot_update_service_1.BotUpdateService],
    })
], BotModule);
//# sourceMappingURL=bot.module.js.map