/**
 * Storage Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

export interface UploadFileRequestDto {
  bucket: string;
  path: string;
  file: File;
}

export interface GetPublicUrlRequestDto {
  bucket: string;
  path: string;
}

export interface DeleteFileRequestDto {
  bucket: string;
  path: string;
}

export interface ListFilesRequestDto {
  bucket: string;
  prefix?: string;
}

export interface DownloadFileRequestDto {
  bucket: string;
  path: string;
}

export interface FileExistsRequestDto {
  bucket: string;
  path: string;
}

export interface UploadMultipleFilesRequestDto {
  bucket: string;
  files: Array<{ path: string; file: File }>;
}

export interface DeleteMultipleFilesRequestDto {
  bucket: string;
  paths: string[];
}
