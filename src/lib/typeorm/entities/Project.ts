
import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { ProjectMaterial } from "./ProjectMaterial";

export type ProjectStatus = 'en cours' | 'terminé' | 'en attente' | 'en inspection' | 'suspendu' | 'annulé';
export type ConstructionPhase = 'pre_construction' | 'site_preparation' | 'foundation' | 'framing' | 'structural_work' | 'finishing' | 'post_construction' | 'handover';
export type ConstructionStage = 'planning_design' | 'permits_approvals' | 'site_clearing' | 'excavation' | 'foundation_work' | 'structural_framing' | 'roofing' | 'electrical_plumbing' | 'interior_finishing' | 'exterior_finishing' | 'final_inspection' | 'handover_complete';

@Entity({ name: "projects" })
export class Project {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar" })
  location!: string;

  @Column({ type: "varchar" })
  status!: ProjectStatus;

  @Column({ type: "int" })
  progress!: number;

  @Column({ type: "decimal" })
  budget!: number;

  @Column({ name: "start_date", type: "date" })
  startDate!: Date;

  @Column({ name: "end_date", type: "date", nullable: true })
  endDate!: Date | null;

  @Column({ type: "varchar" })
  thumbnail!: string;

  @Column({ name: "team_size", type: "int" })
  teamSize!: number;

  @Column({ name: "coordinates_latitude", type: "float", nullable: true })
  coordinatesLatitude!: number | null;

  @Column({ name: "coordinates_longitude", type: "float", nullable: true })
  coordinatesLongitude!: number | null;

  // New optional fields
  @Column({ name: "financing_source", type: "varchar", nullable: true })
  financingSource!: string | null;

  @Column({ name: "market_type", type: "varchar", nullable: true })
  marketType!: string | null;

  @Column({ name: "selection_mode", type: "varchar", nullable: true })
  selectionMode!: string | null;

  @Column({ name: "launch_date", type: "date", nullable: true })
  launchDate!: Date | null;

  @Column({ name: "attribution_date", type: "date", nullable: true })
  attributionDate!: Date | null;

  // New fields for project responsable and main contractor
  @Column({ name: "project_responsable_id", type: "uuid", nullable: true })
  projectResponsableId!: string | null;

  @Column({ name: "main_contractor", type: "varchar", nullable: true })
  mainContractor!: string | null;

  // New fields for project reference and payment settings
  @Column({ name: "project_reference", type: "varchar", nullable: true })
  projectReference!: string | null;

  @Column({ name: "allows_initial_payment", type: "boolean", nullable: true, default: false })
  allowsInitialPayment!: boolean | null;

  @Column({ name: "initial_payment_percentage", type: "decimal", nullable: true, default: 0 })
  initialPaymentPercentage!: number | null;

  // Construction workflow fields
  @Column({ name: "current_phase", type: "varchar", nullable: true })
  currentPhase!: ConstructionPhase | null;

  @Column({ name: "current_stage", type: "varchar", nullable: true })
  currentStage!: ConstructionStage | null;

  @Column({ name: "planned_phases", type: "jsonb", nullable: true })
  plannedPhases!: any;

  @Column({ name: "construction_milestones", type: "jsonb", nullable: true })
  constructionMilestones!: any;

  @OneToMany(() => ProjectMaterial, (projectMaterial) => projectMaterial.project, { cascade: true })
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
      status: this.status,
      progress: this.progress,
      budget: this.budget,
      startDate: this.startDate.toISOString().split('T')[0],
      endDate: this.endDate ? this.endDate.toISOString().split('T')[0] : undefined,
      thumbnail: this.thumbnail,
      teamSize: this.teamSize,
      coordinates: this.coordinatesLatitude && this.coordinatesLongitude ? {
        latitude: this.coordinatesLatitude,
        longitude: this.coordinatesLongitude
      } : undefined,
      financingSource: this.financingSource || undefined,
      marketType: this.marketType || undefined,
      selectionMode: this.selectionMode || undefined,
      launchDate: this.launchDate ? this.launchDate.toISOString().split('T')[0] : undefined,
      attributionDate: this.attributionDate ? this.attributionDate.toISOString().split('T')[0] : undefined,
      projectResponsableId: this.projectResponsableId || undefined,
      mainContractor: this.mainContractor || undefined,
      projectReference: this.projectReference || undefined,
      allowsInitialPayment: this.allowsInitialPayment || undefined,
      initialPaymentPercentage: this.initialPaymentPercentage || undefined,
      currentPhase: this.currentPhase || undefined,
      currentStage: this.currentStage || undefined,
      plannedPhases: this.plannedPhases || undefined,
      constructionMilestones: this.constructionMilestones || undefined
    };
  }
}
