import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('horses')
export class Horse {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({type:'varchar', length: 256})
    name!: string;

    @Column({type:'date', nullable: true})
    last_shoeing_date!: Date;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @Column({ default: true })
    is_active!: boolean;
}