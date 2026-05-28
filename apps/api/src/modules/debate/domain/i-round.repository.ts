import { RoundEntity } from "./round.entity";

export interface IRoundRepository {
  create(data: Omit<RoundEntity, "id" | "startedAt" | "endedAt">): Promise<RoundEntity>;
  complete(id: string): Promise<RoundEntity>;
  findByDebate(debateId: string): Promise<RoundEntity[]>;
  findActive(debateId: string): Promise<RoundEntity | null>;
}

export const ROUND_REPOSITORY = Symbol("IRoundRepository");
