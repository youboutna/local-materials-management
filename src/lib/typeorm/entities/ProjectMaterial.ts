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

  @ManyToOne(() => Project, (project) => project.projectMaterials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "project_id" })
  project!: Project;

  @ManyToOne(() => Material, (material) => material.projectMaterials, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: "material_id" })
  material!: Material;

  // Helper method to transform ProjectMaterial to MapLocation
  toMapLocation() {
    // Prefer structured fields from the related material
    let latitude = 0;
    let longitude = 0;
    let region = '';

    if (this.material?.adresse) {
      latitude = this.material.adresse.lat;
      longitude = this.material.adresse.lng;
    }

    if (this.material?.localisation && this.material.localisation.length > 0) {
      region = this.material.localisation[0]; // Or join(', ') for multiple regions
    }

    // Fallback: try to parse from originLocation string if still missing
    if ((!latitude || !longitude) && this.material?.originLocation) {
      const latMatch = this.material.originLocation.match(/Lat:\s*(-?\d+(\.\d+)?)/i);
      const longMatch = this.material.originLocation.match(/Long:\s*(-?\d+(\.\d+)?)/i);
      if (latMatch && longMatch) {
        latitude = parseFloat(latMatch[1]);
        longitude = parseFloat(longMatch[1]);
      }
      region = this.material.originLocation.split(',')[0] || region;
    }

    return {
      id: this.id,
      name: this.material?.name || '',
      type: 'material' as const,
      latitude,
      longitude,
      region
    };
  }

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;
}
