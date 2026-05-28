import type { PersonaDraftDto } from "./analysis";

export interface PersonaDto {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
}

export interface PersonaAddDto {
  name: string;
  demographic: string;
  interests: string[];
  fears: string[];
  priorities: string[];
  color?: string;
  avatarUrl?: string | null;
}

export interface PersonaUpdateDto {
  id: string;
  name?: string;
  demographic?: string;
  interests?: string[];
  fears?: string[];
  priorities?: string[];
  color?: string;
  avatarUrl?: string | null;
}

export interface UpdatePersonasRequestDto {
  add?: PersonaAddDto[];
  update?: PersonaUpdateDto[];
  remove?: string[];
}

export interface UpdatePersonasResponseDto {
  personas: PersonaDraftDto[];
}
