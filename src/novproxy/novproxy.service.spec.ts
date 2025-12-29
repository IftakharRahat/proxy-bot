import { Test, TestingModule } from '@nestjs/testing';
import { NovproxyService } from './novproxy.service';

describe('NovproxyService', () => {
  let service: NovproxyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NovproxyService],
    }).compile();

    service = module.get<NovproxyService>(NovproxyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
