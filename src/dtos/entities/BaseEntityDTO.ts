/**
 * Base Entity DTO
 * Common interface for all entity DTOs
 */

export interface BaseEntityDTO {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  version?: number;
}
