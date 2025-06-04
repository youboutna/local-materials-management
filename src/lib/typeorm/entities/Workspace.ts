
import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Material } from "./Material";

@Entity({ name: "workspaces" })
export class Workspace {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar" })
  location!: string;

  @Column({ type: "varchar", default: "active" })
  status!: string;

  @Column({ name: "contact_manager", type: "varchar", nullable: true })
  contactManager?: string;

  @Column({ name: "contact_phone", type: "varchar", nullable: true })
  contactPhone?: string;

  @Column({ type: "jsonb", default: () => "'[]'" })
  facilities!: string[];

  @OneToMany(() => Material, (material) => material.workspace)
  materials!: Material[];

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;
}
