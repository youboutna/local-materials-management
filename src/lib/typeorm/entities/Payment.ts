
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "payments" })
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "int" })
  amount!: number;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;

  @Column({ type: "varchar", nullable: true })
  inspection_id?: string;

  @Column({ type: "date" })
  payment_date!: string;

  @Column({ type: "varchar" })
  payment_method!: string;

  @Column({ type: "int" })
  progress_at_payment!: number;

  @Column({ type: "varchar" })
  project_id!: string;

  @Column({ type: "varchar" })
  transaction_id!: string;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at!: Date;

  // New contractor fields
  @Column({ type: "varchar", nullable: true })
  contractor_id?: string;

  @Column({ type: "varchar" })
  contractor_name!: string;

  @Column({ type: "varchar" })
  contractor_contact!: string;

  // Method-specific fields
  @Column({ type: "varchar", nullable: true })
  bank_name?: string;

  @Column({ type: "varchar", nullable: true })
  account_number?: string;

  @Column({ type: "varchar", nullable: true })
  check_number?: string;

  @Column({ type: "varchar", nullable: true })
  mobile_number?: string;

  @Column({ type: "varchar", nullable: true })
  mobile_operator?: string;

  @Column({ type: "varchar", nullable: true })
  receiver_name?: string;
}
