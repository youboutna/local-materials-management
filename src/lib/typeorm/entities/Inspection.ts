import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "inspections" })
export class Inspection {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text", nullable: true })
  comments?: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;

  @Column({ type: "date" })
  date!: string;

  @Column({ type: "jsonb", nullable: true })
  documents?: object;

  @Column({ type: "varchar" })
  inspector!: string;

  @Column({ type: "int" })
  progress_at_inspection!: number;

  @Column({ type: "varchar" })
  project_id!: string;

  @Column({ type: "varchar" })
  status!: string;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at!: Date;
}