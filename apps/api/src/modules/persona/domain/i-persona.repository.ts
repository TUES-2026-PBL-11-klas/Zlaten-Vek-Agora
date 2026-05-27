import { PersonaEntity } from "./persona.entity";

export interface IPersonaRepository {
  findByDebate(debateId: string): Promise<PersonaEntity[]>;
  saveMany(personas: Omit<PersonaEntity, "id" | "createdAt">[]): Promise<PersonaEntity[]>;
  updateMany(
    updates: (Pick<PersonaEntity, "id"> & Partial<PersonaEntity>)[],
  ): Promise<PersonaEntity[]>;
  deleteMany(ids: string[]): Promise<void>;
  deleteByDebate(debateId: string): Promise<void>;
}

export const PERSONA_REPOSITORY = Symbol("IPersonaRepository");
