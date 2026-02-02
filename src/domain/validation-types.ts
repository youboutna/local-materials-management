export interface ValidationRule {
  id: string;
  description: string;
  severity: 'error' | 'warning';
}

export interface ValidationIssue {
  rule: ValidationRule;
  location: {
    filePath: string;
    lineNumber: number;
  };
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  summary?: {
    errorCount: number;
    warningCount: number;
  };
}
