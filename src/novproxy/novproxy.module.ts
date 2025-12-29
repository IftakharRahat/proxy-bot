import { Module } from '@nestjs/common';
import { NovproxyService } from './novproxy.service';

@Module({
  providers: [NovproxyService],
  exports: [NovproxyService]
})
export class NovproxyModule { }
