import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleRequestsService } from './role-requests.service';
import { RoleRequestsController } from './role-requests.controller';
import { RoleRequest } from './entities/role-request.entity';
import { User } from '../users/entities/user.entity';
import { QueueModule } from '../queue/queue.module';
import { RolesGuard } from '../auth/roles.guard';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoleRequest, User]),
    QueueModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [RoleRequestsController],
  providers: [RoleRequestsService, RolesGuard],
})
export class RoleRequestsModule {}
