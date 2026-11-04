/** Résultats d'opérations de stockage, indépendants du fournisseur. */
export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  size?: number;
}

export interface DownloadResult {
  success: boolean;
  blob?: Blob;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

