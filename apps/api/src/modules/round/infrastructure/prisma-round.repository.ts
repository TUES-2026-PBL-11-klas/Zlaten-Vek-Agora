import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RoundEntity } from "../domain/round.entity";
import { IRoundRepository } from "../domain/i-round.repository";

@Injectable()
export class PrismaRoundRepository implements IRoundRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByDebate(debateId: string): Promise<RoundEntity[]> {
    return this.prisma.round.findMany({ where: { debateId }, orderBy: { roundNumber: "asc" } });
  }

  findById(id: string): Promise<RoundEntity | null> {
    return this.prisma.round.findUnique({ where: { id } });
  }

  save(data: Omit<RoundEntity, "id" | "startedAt">): Promise<RoundEntity> {
    return this.prisma.round.create({ data });
  }

  complete(id: string, endedAt: Date): Promise<RoundEntity> {
    return this.prisma.round.update({ where: { id }, data: { endedAt } });
  }
}
