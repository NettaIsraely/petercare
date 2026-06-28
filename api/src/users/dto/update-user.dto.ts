import { UserProfileColor } from '../entities/user.entity';

export class UpdateUserDto {
    name?: string;
    email?: string;
    password?: string;
    morning_alert_time?: string;
    evening_alert_time?: string;
    expo_push_token?: string;
    /** @deprecated Ignored for scheduling; barn timezone is always used. */
    timezone?: string;
    profile_color?: UserProfileColor;

    push_notifications_enabled?: boolean;
    notify_feeding_reminders?: boolean;
    notify_shift_reassigned?: boolean;
    notify_unassigned_feeding?: boolean;
    notify_feeding_incomplete_assignee?: boolean;
    notify_feeding_incomplete_broadcast?: boolean;
    notify_task_deadlines?: boolean;
    notify_role_requests?: boolean;
    notify_role_request_resolved?: boolean;
    notify_event_modified?: boolean;
}
