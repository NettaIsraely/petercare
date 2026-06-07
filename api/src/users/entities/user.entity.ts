import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// 1. Define the User Roles matching our system architecture
export enum UserRole {
  OWNER = 'OWNER',
  CAREGIVER = 'CAREGIVER',
  GUEST = 'GUEST',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar' })
  password_hash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.GUEST })
  role!: UserRole;

  @Column({ type: 'time', default: '08:00:00' })
  morning_alert_time!: string;

  @Column({ type: 'time', default: '18:00:00' })
  evening_alert_time!: string;

  // The device address for push notifications
  @Column({ type: 'varchar', nullable: true })
  expo_push_token?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}