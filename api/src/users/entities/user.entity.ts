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

  @Column({ type: 'int', default: 0 })
  display_order!: number;

  @Column({ type: 'time', default: '08:00:00' })
  morning_alert_time!: string;

  @Column({ type: 'time', default: '18:00:00' })
  evening_alert_time!: string;

  @Column({ type: 'varchar', length: 64, default: 'Asia/Jerusalem' })
  timezone!: string;

  // The device address for push notifications
  @Column({ type: 'varchar', nullable: true })
  expo_push_token?: string;

  // The temporary token for password resets
  @Column({ type: 'varchar', nullable: true })
  reset_password_token?: string | null;

  // The strict deadline for when the token expires
  @Column({ type: 'timestamp', nullable: true })
  reset_password_expires?: Date | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}