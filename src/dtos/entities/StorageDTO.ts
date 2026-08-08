/**
 * Storage Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

export interface GetPublicUrlRequestDto {
  bucket: string;
  path: string;
}

export interface Deface ListFilesRequestDto {
  bucket: string;
  prefix?: string;
}

export interxport interface FileExistsRequestDto {
  bucket: string;
  path: string;
}

eles: Array<{ path: string; file: File }>;
}

export interface DeleteMultipleFil