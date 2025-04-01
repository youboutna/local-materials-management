
import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { ProjectMaterial } from "./ProjectMaterial";

@Entity({ name: "projects" })
export class Project {
  @PrimaryGeneratedColumn("uuid")
  id: string = "";

  @Column()
  title: string = "";

  @Column()
  description: string = "";

  @Column()
  location: string = "";

  @Column()
  status: string = "";

  @Column()
  progress: number = 0;

  @Column()
  budget: number = 0;

  @Column({ name: "start_date" })
  startDate: Date = new Date();

  @Column({ name: "end_date", nullable: true })
  endDate: Date | null = null;

  @Column()
  thumbnail: string = "";

  @Column({ name: "team_size" })
  teamSize: number = 0;

  @Column({ name: "coordinates_latitude", nullable: true })
  coordinatesLatitude: number | null = null;

  @Column({ name: "coordinates_longitude", nullable: true })
  coordinatesLongitude: number | null = null;

  @OneToMany(() => ProjectMaterial, (projectMaterial) => projectMaterial.project)
  projectMaterials: ProjectMaterial[] = [];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date = new Date();

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date = new Date();

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
