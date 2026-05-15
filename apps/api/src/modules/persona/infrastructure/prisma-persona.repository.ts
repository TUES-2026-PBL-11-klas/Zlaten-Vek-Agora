import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PersonaEntity } from "../domain/persona.entity";
import { IPersonaRepository } from "../domain/i-persona.repository";

@Injectable()
export class PrismaPersonaRepository implements IPersonaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDebate(debateId: string): Promise<PersonaEntity[]> {
    return this.prisma.persona.findMany({ where: { debateId }, orderBy: { createdAt: "asc" } });
  }

  async saveMany(personas: Omit<PersonaEntity, "id" | "createdAt">[]): Promise<PersonaEntity[]> {
    await this.prisma.persona.createMany({ data: personas });
    return this.prisma.persona.findMany({
      where: { debateId: personas[0].debateId },
      orderBy: { createdAt: "asc" },
    });
  }

  async updateMany(
    updates: (Pick<PersonaEntity, "id"> & Partial<PersonaEntity>)[],
  ): Promise<PersonaEntity[]> {
    await Promise.all(
      updates.map(({ id, ...data }) => this.prisma.persona.update({ where: { id }, data })),
    );
    const ids = updates.map((u) => u.id);
    return this.prisma.persona.findMany({ where: { id: { in: ids } } });
  }
}
