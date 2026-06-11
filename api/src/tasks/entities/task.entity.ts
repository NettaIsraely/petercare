import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({type:'varchar', length:300})
    name!: string;

    @Column({type:'date', nullable: true})
    deadline?: Date;

    @Column({type:'varchar', nullable: true})
    comments?: string;

    @ManyToOne(()=>User)
    @JoinColumn({name: 'assigned_user_id'})
    assigned_user?: User;

    @Column({ type: 'boolean', default: false })
    is_complete!: boolean;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @Column({ type: 'timestamptz', nullable: true })
    deadline_reminder_sent_at?: Date | null;
}
