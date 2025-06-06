import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { ProjectMaterial } from "./ProjectMaterial";
import { Workspace } from "./Workspace";

@Entity({ name: "materials" })
export class Material {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar" })
  category!: string;

  @Column({ type: "varchar" })
  unit!: string;

  @Column({ name: "price_per_unit", type: "decimal", precision: 10, scale: 2 })
  pricePerUnit!: number;

  @Column({ name: "available_quantity", type: "int" })
  availableQuantity!: number;

  @Column({ nullable: true, type: "varchar" })
  image?: string;

  @Column({ name: "origin_location", nullable: true, type: "varchar" })
  originLocation?: string;

  @Column({ name: "minimum_quantity", type: "int", nullable: true })
  minimumQuantity?: number;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @Column({ name: "local_type", type: "varchar", nullable: true })
  localType?: string;

  @Column({ name: "workspace_id", type: "uuid", nullable: true })
  workspaceId?: string;

  @Column({ type: "jsonb", nullable: true })
  localisation?: any[];

  @Column({ type: "varchar", length: 255, nullable: true })
  adresse?: string; // e.g. "12 Rue de la Paix, 75002 Paris, France"

  @Column({ type: "varchar", nullable: true })
  forme?: string;

  @Column({ name: "coordinates_latitude", type: "decimal", precision: 10, scale: 6, nullable: true })
  coordinatesLatitude?: number;

  @Column({ name: "coordinates_longitude", type: "decimal", precision: 10, scale: 6, nullable: true })
  coordinatesLongitude?: number;

  @ManyToOne(() => Workspace, (workspace) => workspace.materials, { nullable: true })
  @JoinColumn({ name: "workspace_id" })
  workspace?: Workspace;

  @OneToMany(() => ProjectMaterial, (projectMaterial) => projectMaterial.material)
  projectMaterials!: ProjectMaterial[];

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;

  getCoordinates(): { lat: number; lng: number } | null {
    if (this.coordinatesLatitude && this.coordinatesLongitude) {
      return {
        lat: this.coordinatesLatitude,
        lng: this.coordinatesLongitude
      };
    }

    if (this.adresse) {
      // ... JSON.parse or this.adresse.lat ...
    }

    return null;
  }
}
