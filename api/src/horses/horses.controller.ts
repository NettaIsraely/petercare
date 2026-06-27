import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { HorsesService } from './horses.service';
import { CreateHorseDto } from './dto/create-horse.dto';
import { UpdateHorseDto } from './dto/update-horse.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { TreatmentsService } from '../treatments/treatments.service';

@UseGuards(JwtAuthGuard)
@Controller('horses')
export class HorsesController {
  constructor(
    private readonly horsesService: HorsesService,
    private readonly treatmentsService: TreatmentsService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  create(@Body() createHorseDto: CreateHorseDto) {
    return this.horsesService.create(createHorseDto);
  }

  @Get()
  findAll() {
    return this.horsesService.findAll();
  }

  @Get(':id/treatments')
  findTreatments(@Param('id') id: string) {
    return this.treatmentsService.findCompletedForHorse(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.horsesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  update(@Param('id') id: string, @Body() updateHorseDto: UpdateHorseDto) {
    return this.horsesService.update(id, updateHorseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.horsesService.remove(id);
  }
}
