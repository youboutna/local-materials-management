
import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { ProjectMaterial } from "./ProjectMaterial";

@Entity({ name: "materials" })
export class Material {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("text")
  description!: string;

  @Column("varchar")
  category!: string;

  @Column("varchar")
  unit!: string;

  @Column({ name: "price_per_unit", type: "decimal" })
  pricePerUnit!: number;

  @Column({ name: "available_quantity", type: "int" })
  availableQuantity!: number;

  @Column({ nullable: true, type: "varchar" })
  image!: string;

  @Column({ name: "origin_location", nullable: true, type: "varchar" })
  originLocation!: string;

  @OneToMany(() => ProjectMaterial, (projectMaterial) => projectMaterial.material)
  projectMaterials!: ProjectMaterial[];

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;
}
