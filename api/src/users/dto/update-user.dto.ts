import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    morning_alert_time?: string;
    evening_alert_time?: string;
    expo_push_token?: string;
    
    // Background Worker Fields (Password Reset)
    reset_password_token?: string | null;
    reset_password_expires?: Date | null;
}
