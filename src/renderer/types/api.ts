// ---- Unified API response format ----

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// ---- Custom error types ----

export class ApiError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthExpiredError';
  }
}

// ---- Enums ----

export enum PasswordStrengthLevel {
  WEAK = 'WEAK',
  MEDIUM = 'MEDIUM',
  STRONG = 'STRONG',
}

export enum ConflictStrategy {
  OVERWRITE = 'OVERWRITE',
  SKIP = 'SKIP',
  KEEP_BOTH = 'KEEP_BOTH',
}
