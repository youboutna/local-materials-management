
import "reflect-metadata";
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

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

  @Column({ nullable: true, type: "varchar", default: "user" })
  role!: string;

  @Column({ name: "avatar_url", nullable: true, type: "varchar" })
  avatarUrl!: string;

  @CreateDateColumn({ name: "created_at", nullable: true, type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", nullable: true, type: "timestamp" })
  updatedAt!: Date;
}
