import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserRole } from "./UserRole";

@Entity({ name: "users" })
export class User {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ type: "uuid", nullable: true })
  instance_id?: string;

  @Column({ type: "varchar", nullable: true })
  aud?: string;

  @Column({ type: "varchar", nullable: true })
  role?: string;

  @Column({ type: "varchar", nullable: true })
  email?: string;

  @Column({ type: "varchar", nullable: true })
  encrypted_password?: string;

  @Column({ type: "timestamptz", nullable: true })
  email_confirmed_at?: Date;

  @Column({ type: "timestamptz", nullable: true })
  invited_at?: Date;

  @Column({ type: "varchar", nullable: true })
  confirmation_token?: string;

  @Column({ type: "timestamptz", nullable: true })
  confirmation_sent_at?: Date;

  @Column({ type: "varchar", nullable: true })
  recovery_token?: string;

  @Column({ type: "timestamptz", nullable: true })
  recovery_sent_at?: Date;

  @Column({ type: "varchar", nullable: true })
  email_change_token_new?: string;

  @Column({ type: "varchar", nullable: true })
  email_change?: string;

  @Column({ type: "timestamptz", nullable: true })
  email_change_sent_at?: Date;

  @Column({ type: "timestamptz", nullable: true })
  last_sign_in_at?: Date;

  @Column({ type: "jsonb", nullable: true })
  raw_app_meta_data?: object;

  @Column({ type: "jsonb", nullable: true })
  raw_user_meta_data?: object;

  @Column({ type: "boolean", nullable: true })
  is_super_admin?: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  created_at?: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at?: Date;

  @Column({ type: "text", nullable: true })
  phone?: string;

  @Column({ type: "timestamptz", nullable: true })
  phone_confirmed_at?: Date;

  @Column({ type: "text", nullable: true })
  phone_change?: string;

  @Column({ type: "varchar", nullable: true })
  phone_change_token?: string;

  @Column({ type: "timestamptz", nullable: true })
  phone_change_sent_at?: Date;

  @Column({ type: "timestamptz", nullable: true })
  confirmed_at?: Date;

  @Column({ type: "varchar", nullable: true })
  email_change_token_current?: string;

  @Column({ type: "int2", nullable: true })
  email_change_confirm_status?: number;

  @Column({ type: "timestamptz", nullable: true })
  banned_until?: Date;

  @Column({ type: "varchar", nullable: true })
  reauthentication_token?: string;

  @Column({ type: "timestamptz", nullable: true })
  reauthentication_sent_at?: Date;

  @Column({ type: "boolean", nullable: true })
  is_sso_user?: boolean;

  @Column({ type: "timestamptz", nullable: true })
  deleted_at?: Date;

  @Column({ type: "boolean", nullable: true })
  is_anonymous?: boolean;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  roles?: UserRole[];
}