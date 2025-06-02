
/**
 * Core Entities for Mauritania-specific project management:
 * Workspaces: Physical/virtual locations
 * Projects: Work initiatives with budgets and timelines
 * Tasks: Action items with Mauritania-timezone awareness
 * Materials: Inventory with import delay tracking
 * Location: Major cities and wilayas
 * Payments: Local transaction records
 * Inspections: Regulatory compliance tracking
 */

export enum Location {
  // Major cities (special status)
  Nouakchott = "Nouakchott", // Capital district
  Nouadhibou = "Nouadhibou", // Economic capital

  // All 15 wilayas (states)
  Adrar = "Adrar",
  Assaba = "Assaba",
  Brakna = "Brakna",
  DakhletNouadhibou = "Dakhlet Nouadhibou",
  Gorgol = "Gorgol",
  Guidimaka = "Guidimaka",
  HodhEchChargui = "Hodh Ech Chargui",
  HodhElGharbi = "Hodh El Gharbi",
  Inchiri = "Inchiri",
  Tagant = "Tagant",
  TirisZemmour = "Tiris Zemmour",
  Trarza = "Trarza",

  // Special cases
  Other = "Other", // For undefined locations
}

export enum OperationalStatus {
  active = "active",
  inactive = "inactive",
  closed = "closed",
}

export interface Workspace {
  id: string;
  name: string;
  location: Location;
  contact?: {
    manager: string;
    phone: string; // Mauritania format
  };
  facilities?: string[]; // ["warehouse", "dormitory"]
  status?: OperationalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeLine {
  start: Date; // Auto-set to Mauritania timezone
  end: Date;
  estimatedDuration?: number; // In days
}

export enum ProjectStatus {
  Planning = "Planning",
  InProgress = "InProgress",
  Pending = "Pending",
  OnHold = "OnHold",
  Suspended = "Suspended",
  Completed = "Completed",
  Cancelled = "Cancelled",
}

export interface ProjectBudget {
  total: number; // In MRO (auto-convert if USD entered)
  spent: number;
  currency: "MRO" | "USD"; // Defaults to MRO
  exchangeRate?: number; // For USD conversions
  lastUpdated: Date;
}

export enum Priority {
  Urgent = "Urgent",
  High = "High",
  Medium = "Medium",
  Low = "Low",
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string; // Unique identifier
  name: string; // Display name ("Construction")
  slug: string; // URL-safe version ("construction")
  color?: string; // For UI display ("#FF5733")
  description?: string; // Additional context
  userId: string;
}

export enum UserRole {
  Admin = "admin",
  Manager = "manager",
  FieldAgent = "field_agent",
  Inspector = "inspector",
  Viewer = "viewer",
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string; // Mauritania format
  role: UserRole;
  image: string;
  workspaceIds: string[]; // Which workspaces they can access
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskStatus {
  Todo = "todo",
  Blocked = "blocked",
  InProgress = "inProgress",
  Done = "done",
}

export interface Task {
  id: string;
  deadline: Date; // Auto-adjust for Mauritania timezone
  assignedTo: string; // User ID
  projectId: string;
  title: string; // "Clear customs for drill parts"
  description?: string;
  status: TaskStatus;
  timeline: TimeLine;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialImage {
  id: string;
  url: string;
  materialId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnhancedMaterial {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string; // "kg", "liters", "units", etc.
  minQuantity: number; // Alert when below this
  workspaceId: string; // Stock is workspace-specific
  workspace?: Workspace; // Populated workspace info
  location: Location; // Where material is located
  timeline?: TimeLine; // Delivery/availability timeline
  lastRestock: Date; // Critical for import delays
  supplier?: {
    name: string;
    contact: string;
    leadTime: number; // Days for restocking
  };
  images: MaterialImage[];
  pricePerUnit: number;
  availableQuantity: number;
  originLocation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentMethod {
  Cash = "cash",
  Bank = "bank",
  MobileMoney = "mobile_money",
  Hawala = "hawala",
}

export interface EnhancedPayment {
  id: string;
  amount: number;
  date: string; // ISO format
  method: PaymentMethod;
  progressAtPayment: number;
  reference: string; // Better than "transaction_id"
  recipient?: string; // Who received payment locally
  verifiedBy?: string; // User ID who verified
  notes?: string;
  attachments?: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export enum InspectionStatus {
  Approved = "Approved",
  RequiresChanges = "RequiresChanges",
  Rejected = "Rejected",
  Pending = "Pending",
}

export interface Inspector {
  id?: string; // If system user
  name: string;
  agency: string;
}

export interface EnhancedInspection {
  id: string;
  date: string;
  status: InspectionStatus;
  inspector: Inspector;
  progressAtInspection: number;
  comments?: string;
  documents?: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentType {
  Contract = "contract",
  Report = "report",
  Invoice = "invoice",
  Inspection = "inspection",
  Permit = "permit",
  Customs = "customs",
}

export enum DocumentFormat {
  Photo = "photo",
  Pdf = "pdf",
  Doc = "doc",
  Excel = "excel",
  CustomsForm = "customs_form",
}

export interface Document {
  id: string;
  type: DocumentType;
  format: DocumentFormat;
  url: string;
  name: string;
  uploadedBy: string; // User ID
  uploadedAt: Date;
  size: number; // KB
  description?: string;
  validityDate?: Date; // For permits, licenses
  createdAt: Date;
  updatedAt: Date;
}

export interface EnhancedProject {
  id: string;
  name: string;
  workspaceId: string;
  workspace?: Workspace;
  status: ProjectStatus;
  priority: Priority;
  budget: ProjectBudget;
  coordinates?: Coordinates;
  location: Location;
  timeline: TimeLine;
  payments: EnhancedPayment[];
  inspections?: EnhancedInspection[];
  tags?: Tag[];
  createdAt: Date;
  updatedAt: Date;
}
