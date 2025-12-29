import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExpiryProcessorService } from './expiry-processor/expiry-processor.service';
import { SessionManagerService } from '../session-manager/session-manager.service';
import { NovproxyService } from '../novproxy/novproxy.service';

@Module({
  imports: [
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
  providers: [ExpiryProcessorService, SessionManagerService, NovproxyService],
  exports: [BullModule],
})
export class QueueModule { }
