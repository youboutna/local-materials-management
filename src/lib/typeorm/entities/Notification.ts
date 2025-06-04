import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "notifications" })
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "jsonb", nullable: true })
  metadata?: object;

  @Column({ type: "boolean" })
  read!: boolean;

  @Column({ type: "varchar" })
  recipient_id!: string;

  @Column({ type: "varchar", nullable: true })
  related_id?: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "varchar" })
  type!: string;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at!: Date;
}