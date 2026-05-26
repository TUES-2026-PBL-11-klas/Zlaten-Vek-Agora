import { Emotion } from "@agora/shared";
import { PersonaEntity } from "../../persona/domain/persona.entity";

export interface DebateEntity {
  id: string;
  userId: string;
  title: string;
  billText: string;
  sourceType: string;
  status: string;
  createdAt: Date;
}

export interface DebateMessageEntity {
  id: string;
  debateId: string;
  roundId: string;
  personaId: string;
  content: string;
  sequence: number;
  emotion: Emotion;
  createdAt: Date;
  persona: PersonaEntity;
  round: { roundNumber: number };
}
