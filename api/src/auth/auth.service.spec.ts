import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { getQueueToken } from '@nestjs/bullmq';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: UsersService, useValue: {} },
        { provide: getQueueToken('notifications'), useValue: { add: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
