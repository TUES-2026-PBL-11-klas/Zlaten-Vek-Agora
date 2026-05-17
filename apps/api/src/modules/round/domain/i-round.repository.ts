import { RoundEntity } from "./round.entity";

export interface IRoundRepository {
  findByDebate(debateId: string): Promise<RoundEntity[]>;
  findById(id: string): Promise<RoundEntity | null>;
  save(round: Omit<RoundEntity, "id" | "startedAt">): Promise<RoundEntity>;
  complete(id: string, endedAt: Date): Promise<RoundEntity>;
}

export const ROUND_REPOSITORY = Symbol("IRoundRepository");
