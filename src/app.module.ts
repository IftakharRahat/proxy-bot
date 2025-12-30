import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { NovproxyModule } from './novproxy/novproxy.module';
import { SessionManagerModule } from './session-manager/session-manager.module';
import { BotModule } from './bot/bot.module';
import { QueueModule } from './queue/queue.module';
import { PaymentModule } from './payment/payment.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ProxyChainModule } from './proxy-chain/proxy-chain.module';
import { AutoProcureModule } from './auto-procure/auto-procure.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    NovproxyModule,
    BotModule,
    QueueModule,
    PaymentModule,
    AdminModule,
    SessionManagerModule,
    AuthModule,
    ProxyChainModule,
    AutoProcureModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
