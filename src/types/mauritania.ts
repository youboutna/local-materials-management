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

import { Feature, Polygon } from 'geojson';

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

export interface Region {
  code: string;
  name: string;
  nameAr: string;
  lat: number;
  lng: number;
  geometry?: Feature<Polygon>;
}

export const MAURITANIA_REGIONS: Region[] = [
  { code: "NKC", name: "Nouakchott", nameAr: "نواكشوط", lat: 18.0858, lng: -15.9785 },
  { code: "NDB", name: "Nouadhibou", nameAr: "نواذيبو", lat: 20.9425, lng: -17.0383 },
  { code: "ADR", name: "Adrar", nameAr: "آدرار", lat: 20.5091, lng: -12.8343 },
  { code: "ASA", name: "Assaba", nameAr: "العصابة", lat: 16.8296, lng: -11.3557 },
  { code: "BRK", name: "Brakna", nameAr: "براكنة", lat: 17.2318, lng: -13.1740 },
  { code: "DKN", name: "Dakhlet Nouadhibou", nameAr: "داخلة نواذيبو", lat: 20.5986, lng: -16.2522 },
  { code: "GOG", name: "Gorgol", nameAr: "كوركول", lat: 15.9717, lng: -13.1740 },
  { code: "GDM", name: "Guidimaka", nameAr: "غيديماغا", lat: 15.3833, lng: -12.1333 },
  { code: "HEC", name: "Hodh Ech Chargui", nameAr: "الحوض الشرقي", lat: 18.6737, lng: -7.0929 },
  { code: "HEG", name: "Hodh El Gharbi", nameAr: "الحوض الغربي", lat: 16.6916, lng: -9.5457 },
  { code: "INC", name: "Inchiri", nameAr: "إينشيري", lat: 20.0281, lng: -15.4065 },
  { code: "TGT", name: "Tagant", nameAr: "تكانت", lat: 18.7128, lng: -10.9408 },
  { code: "TRZ", name: "Tiris Zemmour", nameAr: "تيرس زمور", lat: 24.5774, lng: -9.9018 },
  { code: "TRR", name: "Trarza", nameAr: "ترارزة", lat: 17.8667, lng: -14.6667 }
];


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
  total: number; // In MRU (auto-convert if USD entered)
  spent: number;
  currency: "MRU" | "USD"; // Defaults to MRU
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

  localisation: Region[]; // Selected regions
  forme?: "polygon" | "rectangle" | "circle"; // Shape type
  adresse?: string; // Full address
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
