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

export interface DebateListItemDto {
  id: string;
  title: string;
  status: DebateStatus;
  personaCount: number;
  roundCount: number;
  createdAt: string;
  personas: Array<{ id: string; name: string; color: string }>;
}

export interface DebateOverviewDto {
  id: string;
  title: string;
  status: DebateStatus;
  createdAt: string;
  personas: Array<{ id: string; name: string; demographic: string; color: string }>;
  rounds: {
    completed: number;
    total: number;
    current: { number: number; phase: string } | null;
  };
  keyChanges: string[];
  hasSynthesis: boolean;
}
