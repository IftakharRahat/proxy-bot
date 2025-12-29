import { Test, TestingModule } from '@nestjs/testing';
import { ExpiryProcessorService } from './expiry-processor.service';

describe('ExpiryProcessorService', () => {
  let service: ExpiryProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpiryProcessorService],
    }).compile();

    service = module.get<ExpiryProcessorService>(ExpiryProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
