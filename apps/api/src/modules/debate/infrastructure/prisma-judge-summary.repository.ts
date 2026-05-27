import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { IJudgeSummaryRepository } from "../domain/i-judge-summary.repository";
import { JudgeSummaryEntity } from "../domain/judge-summary.entity";

@Injectable()
export class PrismaJudgeSummaryRepository implements IJudgeSummaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(data: Omit<JudgeSummaryEntity, "id" | "createdAt">): Promise<JudgeSummaryEntity> {
    const row = await this.prisma.judgeSummary.create({
      data: {
        debateId: data.debateId,
        contradictions: data.contradictions,
        commonPoints: data.commonPoints,
        compromises: data.compromises,
        groupSummaries: data.groupSummaries,
      },
    });
    return toEntity(row);
  }

  async findByDebate(debateId: string): Promise<JudgeSummaryEntity | null> {
    const row = await this.prisma.judgeSummary.findUnique({ where: { debateId } });
    return row ? toEntity(row) : null;
  }
}

function toEntity(row: {
  id: string;
  debateId: string;
  contradictions: unknown;
  commonPoints: unknown;
  compromises: unknown;
  groupSummaries: unknown;
  createdAt: Date;
}): JudgeSummaryEntity {
  return {
    id: row.id,
    debateId: row.debateId,
    contradictions: row.contradictions as string[],
    commonPoints: row.commonPoints as string[],
    compromises: row.compromises as string[],
    groupSummaries: row.groupSummaries as Record<string, string>,
    createdAt: row.createdAt,
  };
}
