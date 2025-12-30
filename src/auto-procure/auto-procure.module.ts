import { Module } from '@nestjs/common';
import { AutoProcurementService } from './auto-procure.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NovproxyModule } from '../novproxy/novproxy.module';
import { ProxyChainModule } from '../proxy-chain/proxy-chain.module';
import { AdminModule } from '../admin/admin.module';

@Module({
    imports: [PrismaModule, NovproxyModule, ProxyChainModule, AdminModule],
    providers: [AutoProcurementService],
    exports: [AutoProcurementService],
})
export class AutoProcureModule { }
