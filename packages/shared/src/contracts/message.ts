import type { AgentType } from "../enums/agent-type";
import type { RoundType } from "../enums/round-type";

export interface DebateMessageDto {
  id: string;
  debateId: string;
  agentType: AgentType;
  personaId?: string;
  roundType: RoundType;
  content: string;
  createdAt: string;
}
