export class CreateTaskDto {
    name!:string;
    deadline?:string;
    comments?:string;
    assigned_user_id?:string;
    is_complete?: boolean;
}
