import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { HealthService } from './health.service';
import { NovproxyModule } from '../novproxy/novproxy.module';
import { ProxyChainModule } from '../proxy-chain/proxy-chain.module';

@Module({
  imports: [NovproxyModule, ProxyChainModule],
  controllers: [AdminController],
  providers: [AdminService, HealthService],
  exports: [AdminService]
})
export class AdminModule { }
