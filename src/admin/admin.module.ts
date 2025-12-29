import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { NovproxyModule } from '../novproxy/novproxy.module';

@Module({
  imports: [NovproxyModule],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule { }
