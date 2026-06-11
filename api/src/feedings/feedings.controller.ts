import { Controller, Get, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { FeedingsService } from './feedings.service';
import { UpdateFeedingDto } from './dto/update-feeding.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { VolunteerDto } from './dto/volunteer.dto';
import { AuthUser } from 'src/common/event-permissions';

@UseGuards(JwtAuthGuard)
@Controller('feedings')
export class FeedingsController {
  constructor(private readonly feedingsService: FeedingsService) {}

  @Patch(':id/volunteer')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.CAREGIVER)
  volunteer(@Param('id') feedingId: string, @Req() req: { user: AuthUser }, @Body() volunteerDto: VolunteerDto) {
    return this.feedingsService.volunteer(
      feedingId,
      req.user.userId,
      req.user,
      volunteerDto.notification_time,
    );
  }

  @Patch(':id/take-over')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.CAREGIVER)
  takeOver(@Param('id') feedingId: string, @Req() req: { user: AuthUser }) {
    return this.feedingsService.takeOver(feedingId, req.user);
  }

  @Get()
  findAll() {
    return this.feedingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feedingsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.CAREGIVER)
  update(
    @Param('id') id: string,
    @Req() req: { user: AuthUser },
    @Body() updateFeedingDto: UpdateFeedingDto,
  ) {
    return this.feedingsService.update(id, updateFeedingDto, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.feedingsService.remove(id, req.user);
  }
}
