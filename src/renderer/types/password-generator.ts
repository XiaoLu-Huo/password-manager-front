import type { PasswordStrengthLevel } from './api';

// ---- Password generator request DTOs ----

export interface GeneratePasswordRequest {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeDigits?: boolean;
  includeSpecial?: boolean;
  useDefault?: boolean;
}

// ---- Password generator response DTOs ----

export interface GeneratedPasswordResponse {
  password: string;
  strengthLevel: PasswordStrengthLevel;
}

export interface PasswordRuleResponse {
  id: number;
  ruleName: string;
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeDigits: boolean;
  includeSpecial: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordStrengthResponse {
  strengthLevel: PasswordStrengthLevel;
}
