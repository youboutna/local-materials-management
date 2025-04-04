
import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Project } from "./Project";
import { Material } from "./Material";

@Entity({ name: "project_materials" })
export class ProjectMaterial {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ name: "project_id", type: "uuid" })
  projectId!: string;

  @Column({ name: "material_id", type: "uuid" })
  materialId!: string;

  @ManyToOne(() => Project, (project) => project.projectMaterials)
  @JoinColumn({ name: "project_id" })
  project!: Project;

  @ManyToOne(() => Material, (material) => material.projectMaterials)
  @JoinColumn({ name: "material_id" })
  material!: Material;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;
}
