/**
 * Case Conversion Transformers
 * Handles snake_case to camelCase conversion for hexagonal architecture
 * Following Rule #2: Casing Conventions and Rule #9: TypeScript Error Resolution
 */

/**
 * Converts snake_case string to camelCase
 * @param input Snake_case string
 * @returns camelCase string
 */
export function snakeToCamelCase(input: string): string {
  return input.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts camelCase string to snake_case
 * @param input camelCase string
 * @returns snake_case string
 */
export function camelToSnakeCase(input: string): string {
  return input.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * Transforms object keys from snake_case to camelCase recursively
 * @param obj Object with snake_case keys
 * @returns Object with camelCase keys
 */
export function transformKeysToCamelCase<T = Record<string, unknown>>(obj: Record<string, unknown>): T {
  if (obj === null || typeof obj !== 'object') {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformKeysToCamelCase(item)) as T;
  }

  const result: Record<string, unknown> = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = snakeToCamelCase(key);
      const value = obj[key];
      
      // Recursively transform nested objects
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[camelKey] = transformKeysToCamelCase(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        result[camelKey] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? transformKeysToCamelCase(item as Record<string, unknown>)
            : item
        );
      } else {
        result[camelKey] = value;
      }
    }
  }
  
  return result as T;
}

/**
 * Transforms object keys from camelCase to snake_case recursively
 * @param obj Object with camelCase keys
 * @returns Object with snake_case keys
 */
export function transformKeysToSnakeCase<T = Record<string, unknown>>(obj: Record<string, unknown>): T {
  if (obj === null || typeof obj !== 'object') {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformKeysToSnakeCase(item)) as T;
  }

  const result: Record<string, unknown> = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = camelToSnakeCase(key);
      const value = obj[key];
      
      // Recursively transform nested objects
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[snakeKey] = transformKeysToSnakeCase(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        result[snakeKey] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? transformKeysToSnakeCase(item as Record<string, unknown>)
            : item
        );
      } else {
        result[snakeKey] = value;
      }
    }
  }
  
  return result as T;
}

/**
 * Inspection-specific transformer
 * Handles legacy snake_case to camelCase conversion for inspection data
 */
export class InspectionTransformer {
  /**
   * Transforms database row (snake_case) to InspectionDTO (camelCase)
   */
  static fromDatabaseRow(row: Record<string, unknown>): any {
    return transformKeysToCamelCase(row);
  }

  /**
   * Transforms InspectionDTO (camelCase) to database format (snake_case)
   */
  static toDatabaseRow(dto: Record<string, unknown>): any {
    return transformKeysToSnakeCase(dto);
  }

  /**
   * Merges legacy snake_case properties with camelCase properties
   * Ensures backward compatibility during migration
   */
  static mergeLegacyData(data: Record<string, unknown>): any {
    const camelCaseData = transformKeysToCamelCase(data);
    
    // Preserve both camelCase and snake_case for backward compatibility
    return {
      ...camelCaseData,
      // Keep original snake_case properties as aliases
      project_id: data.project_id || data.projectId,
      date: data.date || data.scheduledDate,
      progress_at_inspection: data.progress_at_inspection || data.progress,
      phase_id: data.phase_id || data.phaseId,
      created_at: data.created_at || data.createdAt,
      updated_at: data.updated_at || data.updatedAt,
    };
  }
}

/**
 * Project-specific transformer
 * Handles legacy snake_case to camelCase conversion for project data
 */
export class ProjectTransformer {
  /**
   * Transforms database row (snake_case) to ProjectDTO (camelCase)
   */
  static fromDatabaseRow(row: Record<string, unknown>): any {
    return transformKeysToCamelCase(row);
  }

  /**
   * Transforms ProjectDTO (camelCase) to database format (snake_case)
   */
  static toDatabaseRow(dto: Record<string, unknown>): any {
    return transformKeysToSnakeCase(dto);
  }

  /**
   * Merges legacy snake_case properties with camelCase properties
   */
  static mergeLegacyData(data: Record<string, unknown>): any {
    const camelCaseData = transformKeysToCamelCase(data);
    
    return {
      ...camelCaseData,
      // Keep original snake_case properties as aliases
      project_name: data.project_name || data.projectName,
      start_date: data.start_date || data.startDate,
      end_date: data.end_date || data.endDate,
      created_at: data.created_at || data.createdAt,
      updated_at: data.updated_at || data.updatedAt,
    };
  }
}

/**
 * Generic transformer for any DTO
 * Can be used for entities that don't have specific transformers
 */
export class GenericTransformer {
  /**
   * Transforms snake_case to camelCase
   */
  static fromSnakeCase<T = Record<string, unknown>>(data: Record<string, unknown>): T {
    return transformKeysToCamelCase(data);
  }

  /**
   * Transforms camelCase to snake_case
   */
  static toSnakeCase<T = Record<string, unknown>>(data: Record<string, unknown>): T {
    return transformKeysToSnakeCase(data);
  }
}
