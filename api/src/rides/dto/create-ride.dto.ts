export class CreateRideDto {
    date!: string;
    start_time!: string;
    end_time!: string;
    primary_rider_id!: string;
    additional_riders_ids?: string[];
    horses!: string[];
}
