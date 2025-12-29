import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BotUpdateService } from './bot-update/bot-update.service';
import { NovproxyModule } from '../novproxy/novproxy.module';
import { SessionManagerModule } from '../session-manager/session-manager.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_BOT_TOKEN') || '',
        launchOptions: {
          webhook: undefined, // Use long polling for development
        },
      }),
    }),
    SessionManagerModule,
    NovproxyModule,
    PaymentModule,
  ],
  providers: [BotUpdateService],
})
export class BotModule { }
