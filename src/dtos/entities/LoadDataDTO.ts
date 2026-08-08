// Auto-generated DTO

// Moved from src/dtos/entities/ProjectAggregateDTO.ts (reconciled)
export interface ImportOptions {
  maxFileSize: number; // in bytes
  allowedFormats: string[];
  encoding?: string;
}

// Moved from src/dtos/entities/ProjectAggregateDTO.ts (reconciled)
export interface ImportResult {
  success: boolean;
  message: string;
  importedCount?: number;
  errors?: string[];
}

// Moved from src/dtos/entities/ProjectImportDTO.ts (reconciled)
export interface ImportResult {
  success: boolean;
  imported: number;
  total: number;
  errors: string[];
  warnings?: string[];
  importedProjects?: ProjectExportDTO[];
}

// Moved from src/dtos/entities/ProjectImportDTO.ts (reconciled)
export interface ImportMode {
  mode: 'create' | 'update' | 'patch';
  strategy: 'skipDuplicates' | 'overwrite' | 'merge';
}

// Moved from src/dtos/entities/ProjectImportDTO.ts (reconciled)
export interface ImportOptions {
  maxFileSize: number;
  allowedFormats: string[];
  allowedMimeTypes: string[];
  validationRules: ValidationRule[];
}

// Moved from src/dtos/entities/ProjectReportDTO.ts (reconciled)
export interface ImportOptions {
  skipDuplicates?: boolean;
  validateData?: boolean;
  updateExisting?: boolean;
  dryRun?: boolean;
  format?: 'json' | 'csv' | 'xlsx';
  maxFileSize?: number;
  allowedFormats?: string[];
  allowedMimeTypes?: string[];
  validationRules?: Array<{
    field: string;
    required: boolean;
    type: string;
  }>;
}

// Moved from src/dtos/entities/ProjectReportDTO.ts (reconciled)
export interface ImportResult {
  success: boolean;
  message?: string;
  importedCount?: number;
  imported?: number;
  skipped?: number;
  failed?: number;
  errors?: string[];
  warnings?: string[];
  importedProjects?: any[];
}
