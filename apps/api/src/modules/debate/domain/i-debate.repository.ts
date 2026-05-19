import { DebateEntity } from "./debate.entity";

export interface DebateListItem {
  id: string;
  title: string;
  status: string;
  personaCount: number;
  roundCount: number;
  createdAt: Date;
  personas: Array<{ id: string; name: string; color: string }>;
}

export interface DebateOverview {
  id: string;
  userId: string;
  title: string;
  status: string;
  createdAt: Date;
  personas: Array<{ id: string; name: string; demographic: string; color: string }>;
  rounds: {
    completed: number;
    total: number;
    current: { number: number; phase: string } | null;
  };
  keyChanges: string[];
  hasSynthesis: boolean;
}

export interface IDebateRepository {
  findById(id: string): Promise<DebateEntity | null>;
  findByUser(userId: string): Promise<DebateEntity[]>;
  listForUser(userId: string): Promise<DebateListItem[]>;
  findOverviewById(id: string): Promise<DebateOverview | null>;
  save(debate: Omit<DebateEntity, "id" | "createdAt">): Promise<DebateEntity>;
  updateStatus(id: string, status: string): Promise<DebateEntity>;
}

export const DEBATE_REPOSITORY = Symbol("IDebateRepository");
