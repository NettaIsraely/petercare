import { HorseColor } from '../entities/horse.entity';

export class CreateHorseDto {
    name!: string;
    color!: HorseColor;
    last_shoeing_date?: string;
}
