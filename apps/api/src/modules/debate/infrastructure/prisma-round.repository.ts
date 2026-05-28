import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { IRoundRepository } from "../domain/i-round.repository";
import { RoundEntity } from "../domain/round.entity";

@Injectable()
export class PrismaRoundRepository implements IRoundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Omit<RoundEntity, "id" | "startedAt" | "endedAt">): Promise<RoundEntity> {
    const row = await this.prisma.round.create({
      data: {
        debateId: data.debateId,
        roundNumber: data.roundNumber,
        phase: data.phase,
      },
    });
    return toEntity(row);
  }

  async complete(id: string): Promise<RoundEntity> {
    const row = await this.prisma.round.update({
      where: { id },
      data: { endedAt: new Date() },
    });
    return toEntity(row);
  }

  async findByDebate(debateId: string): Promise<RoundEntity[]> {
    const rows = await this.prisma.round.findMany({
      where: { debateId },
      orderBy: { roundNumber: "asc" },
    });
    return rows.map(toEntity);
  }

  async findActive(debateId: string): Promise<RoundEntity | null> {
    const row = await this.prisma.round.findFirst({
      where: { debateId, endedAt: null },
      orderBy: { roundNumber: "asc" },
    });
    return row ? toEntity(row) : null;
  }
}

function toEntity(row: {
  id: string;
  debateId: string;
  roundNumber: number;
  phase: string;
  startedAt: Date;
  endedAt: Date | null;
}): RoundEntity {
  return {
    id: row.id,
    debateId: row.debateId,
    roundNumber: row.roundNumber,
    phase: row.phase,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
  };
}
