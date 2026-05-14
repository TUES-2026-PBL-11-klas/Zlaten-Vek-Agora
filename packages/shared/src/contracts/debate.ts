import type { DebateStatus } from "../enums/debate-status";

export interface CreateDebateDto {
  topic: string;
  description?: string;
}

export interface DebateResponseDto {
  id: string;
  topic: string;
  description?: string;
  status: DebateStatus;
  createdAt: string;
  updatedAt: string;
}
