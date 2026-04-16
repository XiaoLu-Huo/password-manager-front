// ---- Security report response DTO ----

export interface SecurityReportResponse {
  totalCredentials: number;
  weakPasswordCount: number;
  duplicatePasswordCount: number;
  expiredPasswordCount: number;
}
