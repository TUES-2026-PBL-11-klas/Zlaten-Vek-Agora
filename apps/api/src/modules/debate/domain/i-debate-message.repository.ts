import { DebateMessageEntity } from "./debate.entity";

export interface IDebateMessageRepository {
  findByDebate(debateId: string): Promise<DebateMessageEntity[]>;
  findByRound(roundId: string): Promise<DebateMessageEntity[]>;
  append(message: Omit<DebateMessageEntity, "id" | "createdAt">): Promise<DebateMessageEntity>;
}

export const DEBATE_MESSAGE_REPOSITORY = Symbol("IDebateMessageRepository");
