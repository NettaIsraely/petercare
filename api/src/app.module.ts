import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { HorsesModule } from './horses/horses.module';
import { TreatmentsModule } from './treatments/treatments.module';
import { RidesModule } from './rides/rides.module';
import { TasksModule } from './tasks/tasks.module';
import { QueueModule } from './queue/queue.module';
import { FeedingsModule } from './feedings/feedings.module';
import { AuthModule } from './auth/auth.module';
import { RoleRequestsModule } from './role-requests/role-requests.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // 1. Load Environment Variables
    ConfigModule.forRoot({
      isGlobal: true, 
      envFilePath: '../.env', 
    }),

    ScheduleModule.forRoot(),

    // 2. Connect to PostgreSQL (Docker)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true, 
        synchronize: true,
        timezone: 'Z',
      }),
    }),

    // 3. Connect to Redis (Docker) for Background Queues
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
    }),

    UsersModule,

    HorsesModule,

    TreatmentsModule,

    RidesModule,

    TasksModule,

    QueueModule,

    FeedingsModule,

    AuthModule,

    RoleRequestsModule,

    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}