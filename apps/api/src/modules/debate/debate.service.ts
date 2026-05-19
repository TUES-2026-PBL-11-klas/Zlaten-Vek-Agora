import { Inject, Injectable } from "@nestjs/common";
import type { DebateListItemDto, DebateOverviewDto } from "@agora/shared";
import { DebateStatus } from "@agora/shared";
import { DEBATE_REPOSITORY, IDebateRepository } from "./domain/i-debate.repository";
import { DebateNotFoundException } from "./domain/debate-not-found.exception";

@Injectable()
export class DebateService {
  constructor(@Inject(DEBATE_REPOSITORY) private readonly debates: IDebateRepository) {}

  async listForUser(userId: string): Promise<DebateListItemDto[]> {
    const rows = await this.debates.listForUser(userId);
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: toDebateStatus(row.status),
      personaCount: row.personaCount,
      roundCount: row.roundCount,
      createdAt: row.createdAt.toISOString(),
      personas: row.personas,
    }));
  }

  async getOverview(id: string, userId: string): Promise<DebateOverviewDto> {
    const overview = await this.debates.findOverviewById(id);
    if (!overview || overview.userId !== userId) {
      throw new DebateNotFoundException(id);
    }

    return {
      id: overview.id,
      title: overview.title,
      status: toDebateStatus(overview.status),
      createdAt: overview.createdAt.toISOString(),
      personas: overview.personas,
      rounds: overview.rounds,
      keyChanges: overview.keyChanges,
      hasSynthesis: overview.hasSynthesis,
    };
  }
}

function toDebateStatus(value: string): DebateStatus {
  return value as DebateStatus;
}
