
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Document } from "./Document";

@Entity({ name: "tender_documents" })
export class TenderDocument {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", nullable: true })
  project_id?: string;

  @Column({ type: "varchar", nullable: true })
  tender_id?: string;

  @Column({ type: "varchar" })
  document_id!: string;

  @Column({ type: "varchar" })
  category!: string;

  @Column({ type: "varchar" })
  subcategory!: string;

  @Column({ type: "boolean", nullable: true })
  is_required?: boolean;

  @Column({ type: "boolean", nullable: true })
  is_submitted?: boolean;

  @Column({ type: "timestamptz", nullable: true })
  submission_date?: Date;

  @Column({ type: "text", nullable: true })
  reviewer_notes?: string;

  @Column({ type: "varchar", nullable: true })
  status?: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at!: Date;

  @OneToMany(() => Document, (document) => document.tenderDocument)
  documents?: Document[];
}
