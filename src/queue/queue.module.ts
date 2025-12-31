import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExpiryProcessorService } from './expiry-processor/expiry-processor.service';
import { SessionManagerModule } from '../session-manager/session-manager.module';
import { NovproxyModule } from '../novproxy/novproxy.module';

@Module({
  imports: [
    ConfigModule,
    SessionManagerModule,
    NovproxyModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: parseInt(configService.get<string>('REDIS_PORT') || '6379', 10),
          password: configService.get<string>('REDIS_PASSWORD'),
          tls: {}, // Required for Upstash
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'session-expiry',
    }),
    BullModule.registerQueue({
      name: 'rotation-cooldown',
    }),
  ],
  providers: [ExpiryProcessorService],
  exports: [BullModule],
})
export class QueueModule { }
