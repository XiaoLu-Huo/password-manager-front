// ---- Security report response DTO ----

export interface SecurityReportResponse {
  totalCredentials: number;
  weakPasswordCount: number;
  mediumPasswordCount: number;
  duplicatePasswordCount: number;
  expiredPasswordCount: number;
}
