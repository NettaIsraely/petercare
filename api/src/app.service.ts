import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getStableTimezone } from './common/timezone.util';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    getStableTimezone(this.configService);
  }

  getHello(): string {
    return 'Hello World!';
  }
}
