// ---- Auth request DTOs ----

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
