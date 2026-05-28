import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { IJudgeSummaryRepository } from "../domain/i-judge-summary.repository";
import { JudgeSummaryEntity, ParticipantShift } from "../domain/judge-summary.entity";

@Injectable()
export class PrismaJudgeSummaryRepository implements IJudgeSummaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(data: Omit<JudgeSummaryEntity, "id" | "createdAt">): Promise<JudgeSummaryEntity> {
    const row = await this.prisma.judgeSummary.create({
      data: {
        debateId: data.debateId,
        contradictions: data.contradictions as unknown as Prisma.InputJsonValue,
        commonGround: data.commonGround as unknown as Prisma.InputJsonValue,
        compromise: data.compromise as unknown as Prisma.InputJsonValue,
        participantShifts: data.participantShifts as unknown as Prisma.InputJsonValue,
        closingStatement: data.closingStatement,
      },
    });
    return toEntity(row);
  }

  async findByDebate(debateId: string): Promise<JudgeSummaryEntity | null> {
    const row = await this.prisma.judgeSummary.findUnique({ where: { debateId } });
    return row ? toEntity(row) : null;
  }
}

type Row = {
  id: string;
  debateId: string;
  contradictions: Prisma.JsonValue;
  commonGround: Prisma.JsonValue;
  compromise: Prisma.JsonValue;
  participantShifts: Prisma.JsonValue;
  closingStatement: string;
  createdAt: Date;
};

function toEntity(row: Row): JudgeSummaryEntity {
  return {
    id: row.id,
    debateId: row.debateId,
    contradictions: asStringArray(row.contradictions),
    commonGround: asStringArray(row.commonGround),
    compromise: asStringArray(row.compromise),
    participantShifts: asShiftArray(row.participantShifts),
    closingStatement: row.closingStatement,
    createdAt: row.createdAt,
  };
}

function asStringArray(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function asShiftArray(value: Prisma.JsonValue): ParticipantShift[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const obj = entry as Record<string, unknown>;
      if (
        typeof obj.personaId !== "string" ||
        typeof obj.openedQuote !== "string" ||
        typeof obj.closedQuote !== "string" ||
        typeof obj.shiftPercent !== "number"
      ) {
        return null;
      }
      return {
        personaId: obj.personaId,
        openedQuote: obj.openedQuote,
        closedQuote: obj.closedQuote,
        shiftPercent: obj.shiftPercent,
      } satisfies ParticipantShift;
    })
    .filter((shift): shift is ParticipantShift => shift !== null);
}
