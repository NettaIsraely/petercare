import { Horse } from "src/horses/entities/horse.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('treatments')
export class Treatment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({type:'varchar', length:255})
    name!: string;

    @Column({type:'int', nullable: true})
    duration_minutes?: number;

    @ManyToMany(() => Horse)
    @JoinTable({ name: 'treatment_horses' })
    horses!: Horse[];

    @ManyToOne(()=>User)
    @JoinColumn({name:'user_id'})
    user!: User;

    @Column({ type: 'date', default: () => 'CURRENT_DATE'})
    date!: Date;

    @Column({ type: 'boolean', default: false })
    is_complete!: boolean;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
