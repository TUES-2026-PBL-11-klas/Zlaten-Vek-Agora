import type { PersonaDraftDto } from "@agora/shared";
import { PersonaEntity } from "./domain/persona.entity";

export function toPersonaDraftDto(persona: PersonaEntity): PersonaDraftDto {
  return {
    id: persona.id,
    name: persona.name,
    demographic: persona.demographic,
    interests: persona.interests,
    fears: persona.fears,
    priorities: persona.priorities,
    color: persona.color,
    avatarUrl: persona.avatarUrl,
  };
}
