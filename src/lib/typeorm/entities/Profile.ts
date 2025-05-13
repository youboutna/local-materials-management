
import "reflect-metadata";
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

// Define the role types based on what's in the database
export type UserRole = "insurance_company" | "practitioner" | "patient" | string;

@Entity({ name: "profiles" })
export class Profile {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ nullable: true, type: "varchar" })
  full_name!: string;

  @Column({ nullable: true, type: "varchar" })
  phone!: string;

  @Column({ nullable: true, type: "varchar" })
  national_id!: string;

  @Column({ nullable: true, type: "varchar", default: "patient" })
  role!: UserRole;

  @Column({ name: "avatar_url", nullable: true, type: "varchar" })
  avatarUrl!: string;

  @CreateDateColumn({ name: "created_at", nullable: true, type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", nullable: true, type: "timestamp" })
  updatedAt!: Date;
}
