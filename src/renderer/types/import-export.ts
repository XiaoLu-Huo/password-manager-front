import type { ConflictStrategy } from './api';

// ---- Import/Export request DTOs ----

export interface ExportRequest {
  encryptionPassword: string;
}

export interface ImportRequest {
  filePassword: string;
  conflictStrategy: ConflictStrategy;
}

// ---- Import/Export response DTOs ----

export interface ExportResultResponse {
  fileName: string;
  fileSize: number;
}

export interface ImportResultResponse {
  importedCount: number;
  skippedCount: number;
  overwrittenCount: number;
  totalCount: number;
}
