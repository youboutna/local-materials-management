import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "employees" })
export class Employee {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "jsonb", nullable: true })
  certifications?: object;

  @CreateDateColumn({ type: "timestamptz", nullable: true })
  created_at?: Date;

  @Column({ type: "varchar", nullable: true })
  department?: string;

  @Column({ type: "varchar", nullable: true })
  email?: string;

  @Column({ type: "varchar" })
  employee_id!: string;

  @Column({ type: "varchar" })
  full_name!: string;

  @Column({ type: "timestamptz", nullable: true })
  hire_date?: Date;

  @Column({ type: "boolean", nullable: true })
  is_active?: boolean;

  @Column({ type: "varchar", nullable: true })
  manager_id?: string;

  @Column({ type: "varchar", nullable: true })
  phone?: string;

  @Column({ type: "varchar", nullable: true })
  position?: string;

  @Column({ type: "int", nullable: true })
  salary?: number;

  @Column({ type: "simple-array", nullable: true })
  skills?: string[];

  @Column({ type: "varchar", nullable: true })
  superior_id?: string;

  @UpdateDateColumn({ type: "timestamptz", nullable: true })
  updated_at?: Date;

  @Column({ type: "varchar", nullable: true })
  user_id?: string;
}