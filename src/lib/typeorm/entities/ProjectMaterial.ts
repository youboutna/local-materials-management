
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
  toMapLocation(materialName: string, originLocation?: string) {
    // Extract coordinates from the origin location string (if available)
    // Format expected: "Location Name, Lat: 20.5169, Long: -13.0499"
    let latitude = 0;
    let longitude = 0;
    
    if (originLocation) {
      const latMatch = originLocation.match(/Lat:\s*(-?\d+(\.\d+)?)/i);
      const longMatch = originLocation.match(/Long:\s*(-?\d+(\.\d+)?)/i);
      
      if (latMatch && longMatch) {
        latitude = parseFloat(latMatch[1]);
        longitude = parseFloat(longMatch[1]);
      }
    }
    
    return {
      id: this.id,
      name: materialName,
      type: 'material' as const,
      latitude: latitude,
      longitude: longitude,
      region: originLocation?.split(',')[0] || ''
    };
  }

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;
}
