import { Module } from '@nestjs/common';
import { SessionManagerService } from './session-manager.service';
import { RotationService } from './rotation.service';
import { NovproxyModule } from '../novproxy/novproxy.module';
import { ProxyChainModule } from '../proxy-chain/proxy-chain.module';

@Module({
    imports: [NovproxyModule, ProxyChainModule],
    providers: [SessionManagerService, RotationService],
    exports: [SessionManagerService],
})
export class SessionManagerModule { }
