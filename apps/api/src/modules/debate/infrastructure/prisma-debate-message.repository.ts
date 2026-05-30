import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { PersonaEntity } from "../../persona/domain/persona.entity";
import { DebateMessageEntity } from "../domain/debate.entity";
import { IDebateMessageRepository } from "../domain/i-debate-message.repository";

type PrismaMessageWithRelations = Prisma.DebateMessageGetPayload<{
  include: { persona: true; round: { select: { roundNumber: true } } };
}>;

@Injectable()
export class PrismaDebateMessageRepository implements IDebateMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDebate(debateId: string): Promise<DebateMessageEntity[]> {
    const rows = await this.prisma.debateMessage.findMany({
      where: { debateId },
      include: { persona: true, round: { select: { roundNumber: true } } },
      orderBy: [{ round: { roundNumber: "asc" } }, { sequence: "asc" }],
    });
    return rows.map(toEntity);
  }

  async findByRound(roundId: string): Promise<DebateMessageEntity[]> {
    const rows = await this.prisma.debateMessage.findMany({
      where: { roundId },
      include: { persona: true, round: { select: { roundNumber: true } } },
      orderBy: { sequence: "asc" },
    });
    return rows.map(toEntity);
  }

  async append(
    data: Omit<DebateMessageEntity, "id" | "createdAt" | "persona" | "round">,
  ): Promise<DebateMessageEntity> {
    const row = await this.prisma.debateMessage.create({
      data,
      include: { persona: true, round: { select: { roundNumber: true } } },
    });
    return toEntity(row);
  }
}

function toEntity(row: PrismaMessageWithRelations): DebateMessageEntity {
  return {
    id: row.id,
    debateId: row.debateId,
    roundId: row.roundId,
    personaId: row.personaId,
    content: row.content,
    sequence: row.sequence,
    emotion: row.emotion as DebateMessageEntity["emotion"],
    createdAt: row.createdAt,
    persona: toPersona(row.persona),
    round: { roundNumber: row.round.roundNumber },
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((s): s is string => typeof s === "string");
}

function toPersona(p: PrismaMessageWithRelations["persona"]): PersonaEntity {
  return {
    id: p.id,
    debateId: p.debateId,
    name: p.name,
    demographic: p.demographic,
    interests: toStringArray(p.interests),
    fears: toStringArray(p.fears),
    priorities: toStringArray(p.priorities),
    color: p.color,
    avatarUrl: p.avatarUrl,
    createdAt: p.createdAt,
  };
}
