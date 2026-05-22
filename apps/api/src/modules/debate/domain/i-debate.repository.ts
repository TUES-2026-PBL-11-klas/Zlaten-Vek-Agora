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
  turns: number;
  keyChanges: string[];
  hasSynthesis: boolean;
}

export interface DebateListPage {
  items: DebateListItem[];
  total: number;
}

export interface ChamberStats {
  totalDebates: number;
  totalParticipants: number;
  lastActiveAt: Date | null;
}

export interface IDebateRepository {
  findById(id: string): Promise<DebateEntity | null>;
  findByUser(userId: string): Promise<DebateEntity[]>;
  listForUser(userId: string, page: number, pageSize: number): Promise<DebateListPage>;
  getChamberStats(userId: string): Promise<ChamberStats>;
  findOverviewById(id: string): Promise<DebateOverview | null>;
  save(debate: Omit<DebateEntity, "id" | "createdAt">): Promise<DebateEntity>;
  updateStatus(id: string, status: string): Promise<DebateEntity>;
}

export const DEBATE_REPOSITORY = Symbol("IDebateRepository");
