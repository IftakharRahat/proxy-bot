import { Test, TestingModule } from '@nestjs/testing';
import { BotUpdateService } from './bot-update.service';

describe('BotUpdateService', () => {
  let service: BotUpdateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BotUpdateService],
    }).compile();

    service = module.get<BotUpdateService>(BotUpdateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
