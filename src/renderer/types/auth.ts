// ---- Auth request DTOs ----

export interface RegisterRequest {
  username: string;
  email: string;
  masterPassword: string;
}

export interface LoginRequest {
  identifier: string; // 用户名或邮箱
  masterPassword: string;
}

export interface CreateMasterPasswordRequest {
  masterPassword: string;
}

export interface UnlockVaultRequest {
  masterPassword: string;
}

export interface VerifyTotpRequest {
  totpCode: string;
}

export interface EnableMfaRequest {
  totpCode?: string;
}

// ---- Auth response DTOs ----

export interface UnlockResultResponse {
  mfaRequired: boolean;
  sessionToken: string | null;
}

export interface MfaSetupResponse {
  qrCodeUri: string;
  recoveryCodes: string[];
}
