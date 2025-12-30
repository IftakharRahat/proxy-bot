import { Module } from '@nestjs/common';
import { ProxyChainService } from './proxy-chain.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [PrismaModule, ConfigModule],
    providers: [ProxyChainService],
    exports: [ProxyChainService],
})
export class ProxyChainModule { }
