import { ShiftType } from "../entities/feeding.entity";

export class CreateFeedingDto {
    schedule_date!: string;
    shift_type!: ShiftType;
    assigned_user_id?: string;
}
