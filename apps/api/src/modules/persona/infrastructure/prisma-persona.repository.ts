import { Injectable } from "@nestjs/common";
import { Persona as PrismaPersona, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { PersonaEntity } from "../domain/persona.entity";
import { IPersonaRepository } from "../domain/i-persona.repository";

@Injectable()
export class PrismaPersonaRepository implements IPersonaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDebate(debateId: string): Promise<PersonaEntity[]> {
    const rows = await this.prisma.persona.findMany({
      where: { debateId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toEntity);
  }

  async saveMany(personas: Omit<PersonaEntity, "id" | "createdAt">[]): Promise<PersonaEntity[]> {
    if (personas.length === 0) return [];
    const created = await this.prisma.$transaction(
      personas.map((p) =>
        this.prisma.persona.create({
          data: {
            debateId: p.debateId,
            name: p.name,
            demographic: p.demographic,
            interests: p.interests as unknown as Prisma.InputJsonValue,
            fears: p.fears as unknown as Prisma.InputJsonValue,
            priorities: p.priorities as unknown as Prisma.InputJsonValue,
            color: p.color,
            avatarUrl: p.avatarUrl,
          },
        }),
      ),
    );
    return created.map(toEntity);
  }

  async updateMany(
    updates: (Pick<PersonaEntity, "id"> & Partial<PersonaEntity>)[],
  ): Promise<PersonaEntity[]> {
    if (updates.length === 0) return [];
    const updated = await this.prisma.$transaction(
      updates.map(({ id, ...data }) => {
        const payload: Prisma.PersonaUpdateInput = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.demographic !== undefined) payload.demographic = data.demographic;
        if (data.interests !== undefined)
          payload.interests = data.interests as unknown as Prisma.InputJsonValue;
        if (data.fears !== undefined)
          payload.fears = data.fears as unknown as Prisma.InputJsonValue;
        if (data.priorities !== undefined)
          payload.priorities = data.priorities as unknown as Prisma.InputJsonValue;
        if (data.color !== undefined) payload.color = data.color;
        if (data.avatarUrl !== undefined) payload.avatarUrl = data.avatarUrl;
        return this.prisma.persona.update({ where: { id }, data: payload });
      }),
    );
    return updated.map(toEntity);
  }

  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.persona.deleteMany({ where: { id: { in: ids } } });
  }

  async deleteByDebate(debateId: string): Promise<void> {
    await this.prisma.persona.deleteMany({ where: { debateId } });
  }
}

function toEntity(row: PrismaPersona): PersonaEntity {
  return {
    id: row.id,
    debateId: row.debateId,
    name: row.name,
    demographic: row.demographic,
    interests: toStringArray(row.interests),
    fears: toStringArray(row.fears),
    priorities: toStringArray(row.priorities),
    color: row.color,
    avatarUrl: row.avatarUrl,
    createdAt: row.createdAt,
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((s): s is string => typeof s === "string");
}
