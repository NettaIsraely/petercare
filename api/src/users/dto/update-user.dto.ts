export class UpdateUserDto {
    name?: string;
    email?: string;
    password?: string;
    morning_alert_time?: string;
    evening_alert_time?: string;
    expo_push_token?: string;
    timezone?: string;

    // Background Worker Fields (Password Reset)
    reset_password_token?: string | null;
    reset_password_expires?: Date | null;
}
