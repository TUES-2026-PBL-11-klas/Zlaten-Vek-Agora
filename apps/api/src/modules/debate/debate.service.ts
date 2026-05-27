import { Inject, Injectable } from "@nestjs/common";
import type {
  ActiveTurnDto,
  CreateDebateResponseDto,
  DebateChamberStatsDto,
  DebateDetailDto,
  DebateListItemDto,
  DebateOverviewDto,
  Paginated,
} from "@agora/shared";
import { DebateStatus } from "@agora/shared";
import { AppException } from "../../common/exceptions/app.exception";
import { BillTooLongException } from "../../common/exceptions/bill-too-long.exception";
import { DebateMessageEntity } from "./domain/debate.entity";
import { BILL_TEXT_EXTRACTOR, IBillTextExtractor } from "./domain/bill-text-extractor";
import { DEBATE_REPOSITORY, DebateOverview, IDebateRepository } from "./domain/i-debate.repository";
import {
  DEBATE_MESSAGE_REPOSITORY,
  IDebateMessageRepository,
} from "./domain/i-debate-message.repository";
import { DebateNotFoundException } from "./domain/debate-not-found.exception";

@Injectable()
export class DebateService {
  constructor(
    @Inject(DEBATE_REPOSITORY) private readonly debates: IDebateRepository,
    @Inject(DEBATE_MESSAGE_REPOSITORY) private readonly messages: IDebateMessageRepository,
    @Inject(BILL_TEXT_EXTRACTOR) private readonly extractor: IBillTextExtractor,
  ) {}

  async create(
    userId: string,
    billTitle: string,
    billText: string | undefined,
    file: Express.Multer.File | undefined,
  ): Promise<CreateDebateResponseDto> {
    if (!file && !billText) {
      throw new AppException(
        "Either a PDF file or bill text must be provided",
        400,
        "MISSING_BILL_CONTENT",
      );
    }

    let text: string;
    let sourceType: string;

    if (file) {
      text = await this.extractor.extractFromPdf(file.buffer);
      sourceType = "pdf";
    } else {
      text = this.extractor.cleanText(billText!);
      if (text.length > 200_000) {
        throw new BillTooLongException(text.length);
      }
      sourceType = "text";
    }

    const debate = await this.debates.save({
      userId,
      title: billTitle,
      billText: text,
      sourceType,
      status: DebateStatus.Draft,
    });

    return {
      debateId: debate.id,
      billTitle: debate.title,
      status: DebateStatus.Draft,
    };
  }

  async listForUser(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<Paginated<DebateListItemDto>> {
    const { items, total } = await this.debates.listForUser(userId, page, pageSize);
    return {
      items: items.map((row) => ({
        id: row.id,
        title: row.title,
        status: toDebateStatus(row.status),
        personaCount: row.personaCount,
        roundCount: row.roundCount,
        createdAt: row.createdAt.toISOString(),
        personas: row.personas,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getChamberStats(userId: string): Promise<DebateChamberStatsDto> {
    const stats = await this.debates.getChamberStats(userId);
    return {
      totalDebates: stats.totalDebates,
      totalParticipants: stats.totalParticipants,
      lastActiveAt: stats.lastActiveAt?.toISOString() ?? null,
    };
  }

  async getOverview(id: string, userId: string): Promise<DebateOverviewDto> {
    const overview = await this.requireOverview(id, userId);
    return toOverviewDto(overview);
  }

  async getDetail(id: string, userId: string): Promise<DebateDetailDto> {
    const overview = await this.requireOverview(id, userId);
    const messages = await this.messages.findByDebate(id);

    return {
      ...toOverviewDto(overview),
      messages: messages.map((message) => ({
        id: message.id,
        roundId: message.roundId,
        roundNumber: message.round.roundNumber,
        turnIndex: message.sequence,
        emotion: message.emotion,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        persona: {
          id: message.persona.id,
          name: message.persona.name,
          demographic: message.persona.demographic,
          color: message.persona.color,
        },
      })),
      activeTurn: computeActiveTurn(overview, messages),
    };
  }

  private async requireOverview(id: string, userId: string): Promise<DebateOverview> {
    const overview = await this.debates.findOverviewById(id);
    if (!overview || overview.userId !== userId) {
      throw new DebateNotFoundException(id);
    }
    return overview;
  }
}

function toOverviewDto(overview: DebateOverview): DebateOverviewDto {
  return {
    id: overview.id,
    title: overview.title,
    status: toDebateStatus(overview.status),
    createdAt: overview.createdAt.toISOString(),
    personas: overview.personas,
    rounds: overview.rounds,
    turns: overview.turns,
    keyChanges: overview.keyChanges,
    hasSynthesis: overview.hasSynthesis,
  };
}

function toDebateStatus(value: string): DebateStatus {
  return value as DebateStatus;
}

function computeActiveTurn(
  overview: DebateOverview,
  messages: DebateMessageEntity[],
): ActiveTurnDto | null {
  if (toDebateStatus(overview.status) !== DebateStatus.Running) return null;
  if (!overview.rounds.current || overview.personas.length === 0) return null;

  const currentRoundNumber = overview.rounds.current.number;
  const inRound = messages.filter((m) => m.round.roundNumber === currentRoundNumber);
  const turnIndex = inRound.length;
  const personaId = overview.personas[turnIndex % overview.personas.length].id;

  return { roundNumber: currentRoundNumber, turnIndex, personaId };
}
