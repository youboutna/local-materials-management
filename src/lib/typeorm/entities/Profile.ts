
import "reflect-metadata";
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "profiles" })
export class Profile {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ nullable: true })
  full_name!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column({ nullable: true })
  national_id!: string;

  @Column({ nullable: true })
  role!: string;

  @Column({ name: "avatar_url", nullable: true })
  avatarUrl!: string;

  @CreateDateColumn({ name: "created_at", nullable: true })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", nullable: true })
  updatedAt!: Date;
}
