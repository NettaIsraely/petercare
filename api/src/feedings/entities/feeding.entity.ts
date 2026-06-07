import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum ShiftType{
    MORNING = 'MORNING',
    EVENING = 'EVENING'
}

export enum FeedingStatus{
    UNASSIGNED = 'UNASSIGNED',
    ASSIGNED = 'ASSIGNED',
    COMPLETE = 'COMPLETE'
}

@Entity('feedings')
export class Feeding {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({type: 'date'})
    schedule_date!: Date;

    @Column({type: 'enum', enum: ShiftType})
    shift_type!: ShiftType;

    @Column({type: 'enum', enum: FeedingStatus, default: FeedingStatus.UNASSIGNED})
    feeding_status!: FeedingStatus;

    @ManyToOne(()=> User , {nullable: true})
    @JoinColumn({name: 'assigned_user_id'})
    assigned_user?: User;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
