export class CreateTreatmentDto {
    name!: string;
    date?: string;
    duration_minutes?: number;
    horse_id!: string;
    user_id!: string;
}
