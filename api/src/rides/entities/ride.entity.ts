import { Horse } from "src/horses/entities/horse.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('rides')
export class Ride {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({type:'date'})
    date!: Date;

    @Column({type:'time'})
    start_time!: string;

    @Column({type:'time'})
    end_time!: string;

    @ManyToOne(()=> User)
    @JoinColumn({name: 'primary_rider_id'})
    primary_rider!: User;

    @ManyToMany(()=> User)
    @JoinTable({name: 'ride_additional_riders'})
    additional_riders?: User[];

    @ManyToMany(()=> Horse)
    @JoinTable({name: 'ride_horses'})
    horses!: Horse[];

    @Column({type:'varchar', nullable: true})
    comments?: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
