import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";

@Entity({ name: "user_roles" })
export class UserRole {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  user_id!: string;

  @ManyToOne(() => User, (user) => user.roles, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "text" })
  role_name!: string;

  @CreateDateColumn({ type: "timestamptz" })
  assigned_at?: Date;

  @Column({ type: "uuid", nullable: true })
  assigned_by?: string;
}