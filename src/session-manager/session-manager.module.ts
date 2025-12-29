import { Module } from '@nestjs/common';
import { SessionManagerService } from './session-manager.service';
import { RotationService } from './rotation.service';
import { NovproxyModule } from '../novproxy/novproxy.module';

@Module({
    imports: [NovproxyModule],
    providers: [SessionManagerService, RotationService],
    exports: [SessionManagerService],
})
export class SessionManagerModule { }
