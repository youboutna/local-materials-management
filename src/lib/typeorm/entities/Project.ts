
import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { ProjectMaterial } from "./ProjectMaterial";

@Entity({ name: "projects" })
export class Project {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  title!: string;

  @Column("text")
  description!: string;

  @Column("varchar")
  location!: string;

  @Column("varchar")
  status!: string;

  @Column("int")
  progress!: number;

  @Column("decimal")
  budget!: number;

  @Column({ name: "start_date", type: "date" })
  startDate!: Date;

  @Column({ name: "end_date", type: "date", nullable: true })
  endDate!: Date | null;

  @Column("varchar")
  thumbnail!: string;

  @Column({ name: "team_size", type: "int" })
  teamSize!: number;

  @Column({ name: "coordinates_latitude", type: "float", nullable: true })
  coordinatesLatitude!: number | null;

  @Column({ name: "coordinates_longitude", type: "float", nullable: true })
  coordinatesLongitude!: number | null;

  @OneToMany(() => ProjectMaterial, (projectMaterial) => projectMaterial.project)
  projectMaterials!: ProjectMaterial[];

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;

  // Helper method to transform to ProjectData interface
  toProjectData() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      location: this.location,
      status: this.status as 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé',
      progress: this.progress,
      budget: this.budget,
      startDate: this.startDate.toISOString().split('T')[0],
      endDate: this.endDate ? this.endDate.toISOString().split('T')[0] : undefined,
      thumbnail: this.thumbnail,
      teamSize: this.teamSize,
      coordinates: this.coordinatesLatitude && this.coordinatesLongitude ? {
        latitude: this.coordinatesLatitude,
        longitude: this.coordinatesLongitude
      } : undefined
    };
  }
}
