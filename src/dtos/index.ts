/**
 * Centralized DTOs Index
 * Single source of truth for all Data Transfer Objects
 * Promotes reusability and maintains consistency across the application
 */

// Primary export - New centralized DTOs
export * from './entities';

// Re-export shared DTOs and utilities
export * from './shared';

// Re-export transforms with explicit naming to avoid conflicts
export * as TransformUtils from './transforms';
export * as ValidationUtils from './utils';
