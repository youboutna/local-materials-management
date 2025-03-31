
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { ProjectMaterial } from "./ProjectMaterial";

@Entity({ name: "materials" })
export class Material {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  category: string;

  @Column()
  unit: string;

  @Column({ name: "price_per_unit" })
  pricePerUnit: number;

  @Column({ name: "available_quantity" })
  availableQuantity: number;

  @Column({ nullable: true })
  image: string;

  @Column({ name: "origin_location", nullable: true })
  originLocation: string;

  @OneToMany(() => ProjectMaterial, (projectMaterial) => projectMaterial.material)
  projectMaterials: ProjectMaterial[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
