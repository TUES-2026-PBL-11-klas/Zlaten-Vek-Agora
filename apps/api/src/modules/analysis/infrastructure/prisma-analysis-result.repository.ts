import { Injectable } from "@nestjs/common";
import { AnalysisResult as PrismaAnalysisResult, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AffectedGroup, AnalysisResultEntity } from "../domain/analysis-result.entity";
import { IAnalysisResultRepository } from "../domain/i-analysis-result.repository";

@Injectable()
export class PrismaAnalysisResultRepository implements IAnalysisResultRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(
    result: Omit<AnalysisResultEntity, "id" | "createdAt">,
  ): Promise<AnalysisResultEntity> {
    const row = await this.prisma.analysisResult.create({
      data: {
        debateId: result.debateId,
        affectedGroups: result.affectedGroups as unknown as Prisma.InputJsonValue,
        keyChanges: result.keyChanges as unknown as Prisma.InputJsonValue,
        contentiousPoints: result.contentiousPoints as unknown as Prisma.InputJsonValue,
      },
    });
    return toEntity(row);
  }

  async findByDebate(debateId: string): Promise<AnalysisResultEntity | null> {
    const row = await this.prisma.analysisResult.findUnique({ where: { debateId } });
    return row ? toEntity(row) : null;
  }

  async deleteByDebate(debateId: string): Promise<void> {
    await this.prisma.analysisResult.deleteMany({ where: { debateId } });
  }
}

function toEntity(row: PrismaAnalysisResult): AnalysisResultEntity {
  return {
    id: row.id,
    debateId: row.debateId,
    affectedGroups: (row.affectedGroups as unknown as AffectedGroup[]) ?? [],
    keyChanges: (row.keyChanges as unknown as string[]) ?? [],
    contentiousPoints: (row.contentiousPoints as unknown as string[]) ?? [],
    createdAt: row.createdAt,
  };
}
