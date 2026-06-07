import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { FeedingsService } from './feedings.service';
import { CreateFeedingDto } from './dto/create-feeding.dto';
import { UpdateFeedingDto } from './dto/update-feeding.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { VolunteerDto } from './dto/volunteer.dto';

@UseGuards(JwtAuthGuard)
@Controller('feedings')
export class FeedingsController {
  constructor(private readonly feedingsService: FeedingsService) {}

  @Post()
  create(@Body() createFeedingDto: CreateFeedingDto) {
    return this.feedingsService.create(createFeedingDto);
  }

  @Patch(':id/volunteer')
  volunteer(@Param('id') feedingId: string, @Req() req: any, @Body() volunteerDto: VolunteerDto) {
    const extractedId = req.user.userId;
    return this.feedingsService.volunteer(feedingId, extractedId, volunteerDto.notification_time);
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
  update(@Param('id') id: string, @Body() updateFeedingDto: UpdateFeedingDto) {
    return this.feedingsService.update(id, updateFeedingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feedingsService.remove(id);
  }
}
