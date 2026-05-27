import type { DebateStatus } from "../enums/debate-status";
import type { Emotion } from "../enums/emotion";
import type { AnalysisResultDto, PersonaDraftDto } from "./analysis";

export interface CreateDebateDto {
  billTitle: string;
  billText?: string;
}

export interface CreateDebateResponseDto {
  debateId: string;
  billTitle: string;
  status: DebateStatus;
  personas?: PersonaDraftDto[];
  analysis?: AnalysisResultDto;
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
  turns: number;
  keyChanges: string[];
  hasSynthesis: boolean;
}

export interface DebateChamberStatsDto {
  totalDebates: number;
  totalParticipants: number;
  lastActiveAt: string | null;
}

export interface DebateDetailMessageDto {
  id: string;
  roundId: string;
  roundNumber: number;
  turnIndex: number;
  emotion: Emotion;
  content: string;
  createdAt: string;
  persona: { id: string; name: string; demographic: string; color: string };
}

export interface ActiveTurnDto {
  roundNumber: number;
  turnIndex: number;
  personaId: string;
}

export interface DebateDetailDto extends DebateOverviewDto {
  messages: DebateDetailMessageDto[];
  activeTurn: ActiveTurnDto | null;
}
