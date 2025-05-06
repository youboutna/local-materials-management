
import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum RoleType {
  ADMIN = 'admin',
  DEV = 'dev',
  PROJECT_MANAGER = 'project_manager',
  DIRECTOR = 'director'
}

@Entity({ name: "roles" })
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "enum",
    enum: RoleType,
    default: RoleType.DEV
  })
  type!: RoleType;

  @Column()
  name!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;
}
