import { DebateEntity } from "./debate.entity";

export interface IDebateRepository {
  findById(id: string): Promise<DebateEntity | null>;
  findByUser(userId: string): Promise<DebateEntity[]>;
  save(debate: Omit<DebateEntity, "id" | "createdAt">): Promise<DebateEntity>;
  updateStatus(id: string, status: string): Promise<DebateEntity>;
}

export const DEBATE_REPOSITORY = Symbol("IDebateRepository");
