import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { TenderDocument } from "./TenderDocument";

@Entity({ name: "documents" })
export class Document {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", nullable: true })
  assigned_to?: string;

  @CreateDateColumn({ type: "timestamptz", nullable: true })
  created_at?: Date;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar" })
  document_type!: string;

  @Column({ type: "varchar", nullable: true })
  file_name?: string;

  @Column({ type: "int", nullable: true })
  file_size?: number;

  @Column({ type: "varchar", nullable: true })
  file_url?: string;

  @Column({ type: "varchar", nullable: true })
  inspection_id?: string;

  @Column({ type: "jsonb", nullable: true })
  metadata?: object;

  @Column({ type: "varchar", nullable: true })
  mime_type?: string;

  @Column({ type: "varchar", nullable: true })
  project_id?: string;

  @Column({ type: "varchar", nullable: true })
  status?: string;

  @Column({ type: "simple-array", nullable: true })
  tags?: string[];

  @Column({ type: "varchar" })
  title!: string;

  @UpdateDateColumn({ type: "timestamptz", nullable: true })
  updated_at?: Date;

  @Column({ type: "varchar", nullable: true })
  uploaded_by?: string;

  @Column({ type: "uuid", nullable: true })
  tender_document_id?: string;

  @ManyToOne(() => TenderDocument, (tender) => tender.documents, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "tender_document_id" })
  tenderDocument?: TenderDocument;
}