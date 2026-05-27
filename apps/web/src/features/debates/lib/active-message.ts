import type { DebateDetailMessageDto, Emotion } from "@agora/shared";
import type { StreamedMessage } from "../hooks/use-debate-stream";

export interface ActiveMessage {
  personaId: string;
  personaName: string;
  personaDemographic: string;
  personaColor: string;
  roundNumber: number;
  emotion: Emotion | null;
  content: string;
  isStreaming: boolean;
}

export function fromPlaybackMessage(msg: DebateDetailMessageDto): ActiveMessage {
  return {
    personaId: msg.persona.id,
    personaName: msg.persona.name,
    personaDemographic: msg.persona.demographic,
    personaColor: msg.persona.color,
    roundNumber: msg.roundNumber,
    emotion: msg.emotion,
    content: msg.content,
    isStreaming: false,
  };
}

export function fromStreamedMessage(
  msg: StreamedMessage,
  persona: { name: string; demographic: string; color: string },
  roundNumber: number,
): ActiveMessage {
  return {
    personaId: msg.personaId,
    personaName: persona.name,
    personaDemographic: persona.demographic,
    personaColor: persona.color,
    roundNumber,
    emotion: (msg.emotion as Emotion) ?? null,
    content: msg.tokens,
    isStreaming: !msg.complete,
  };
}
