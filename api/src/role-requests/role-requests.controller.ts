import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RoleRequestsService } from './role-requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('role-requests')
@UseGuards(JwtAuthGuard)
export class RoleRequestsController {
  constructor(private readonly roleRequestsService: RoleRequestsService) {}

  @Post()
  create(@Req() req: { user: { userId: string } }) {
    return this.roleRequestsService.create(req.user.userId);
  }

  @Get('mine')
  findMine(@Req() req: { user: { userId: string } }) {
    return this.roleRequestsService.findMine(req.user.userId);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  findPending() {
    return this.roleRequestsService.findPending();
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  approve(@Param('id') id: string, @Req() req: { user: { userId: string } }) {
    return this.roleRequestsService.approve(id, req.user.userId);
  }

  @Patch(':id/deny')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  deny(@Param('id') id: string, @Req() req: { user: { userId: string } }) {
    return this.roleRequestsService.deny(id, req.user.userId);
  }
}
