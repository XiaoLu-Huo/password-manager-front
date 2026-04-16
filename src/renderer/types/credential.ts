// ---- Credential request DTOs ----

export interface CreateCredentialRequest {
  accountName: string;
  username: string;
  password?: string;
  url?: string;
  notes?: string;
  tags?: string;
  autoGenerate?: boolean;
}

export interface UpdateCredentialRequest {
  accountName?: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  tags?: string;
}

export interface SearchCredentialRequest {
  keyword?: string;
}

// ---- Credential response DTOs ----

export interface CredentialResponse {
  id: number;
  accountName: string;
  username: string;
  maskedPassword: string;
  url: string | null;
  notes: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialListResponse {
  id: number;
  accountName: string;
  username: string;
  url: string | null;
  tags: string | null;
}
