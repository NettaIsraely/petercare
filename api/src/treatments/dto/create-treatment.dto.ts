export class CreateTreatmentDto {
    name!: string;
    date?: string;
    duration_minutes?: number;
    horse_ids!: string[];
    user_id!: string;
}
