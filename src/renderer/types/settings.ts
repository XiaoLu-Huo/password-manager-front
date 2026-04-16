// ---- Settings request DTO ----

export interface UpdateSettingsRequest {
  autoLockMinutes: number;
}

// ---- Settings response DTO ----

export interface SettingsResponse {
  autoLockMinutes: number;
  mfaEnabled: boolean;
}
