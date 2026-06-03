import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { DebateEntity } from "../domain/debate.entity";
import {
  ChamberStats,
  DebateListPage,
  DebateOverview,
  IDebateRepository,
} from "../domain/i-debate.repository";

const DEFAULT_TOTAL_ROUNDS = 3;

@Injectable()
export class PrismaDebateRepository implements IDebateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<DebateEntity | null> {
    return this.prisma.debate.findUnique({ where: { id } });
  }

  async findByUser(userId: string): Promise<DebateEntity[]> {
    return this.prisma.debate.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async listForUser(userId: string, page: number, pageSize: number): Promise<DebateListPage> {
    const [rows, total] = await Promise.all([
      this.prisma.debate.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          personas: {
            select: { id: true, name: true, color: true },
            orderBy: { createdAt: "asc" },
            take: 5,
          },
          _count: { select: { personas: true, rounds: true } },
        },
      }),
      this.prisma.debate.count({ where: { userId } }),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      personaCount: row._count.personas,
      roundCount: row._count.rounds,
      createdAt: row.createdAt,
      personas: row.personas,
    }));

    return { items, total };
  }

  async getChamberStats(userId: string): Promise<ChamberStats> {
    const [totalDebates, totalParticipants, lastMessage, lastDebate] = await Promise.all([
      this.prisma.debate.count({ where: { userId } }),
      this.prisma.persona.count({ where: { debate: { userId } } }),
      this.prisma.debateMessage.findFirst({
        where: { debate: { userId } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      this.prisma.debate.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    return {
      totalDebates,
      totalParticipants,
      lastActiveAt: lastMessage?.createdAt ?? lastDebate?.createdAt ?? null,
    };
  }

  async findOverviewById(id: string): Promise<DebateOverview | null> {
    const row = await this.prisma.debate.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        title: true,
        status: true,
        createdAt: true,
        personas: {
          select: { id: true, name: true, demographic: true, color: true },
          orderBy: { createdAt: "asc" },
        },
        rounds: {
          select: { roundNumber: true, phase: true, endedAt: true },
          orderBy: { roundNumber: "asc" },
        },
        analysisResult: { select: { keyChanges: true } },
        judgeSummary: { select: { id: true } },
        _count: { select: { debateMessages: true } },
      },
    });

    if (!row) return null;

    const completed = row.rounds.filter((r) => r.endedAt !== null).length;
    const openRound = row.rounds.find((r) => r.endedAt === null);
    const latestRound = row.rounds[row.rounds.length - 1] ?? null;
    const current = openRound ?? latestRound;

    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      status: row.status,
      createdAt: row.createdAt,
      personas: row.personas,
      rounds: {
        completed,
        total: DEFAULT_TOTAL_ROUNDS,
        current: current ? { number: current.roundNumber, phase: current.phase } : null,
      },
      turns: row._count.debateMessages,
      keyChanges: extractKeyChanges(row.analysisResult?.keyChanges),
      hasSynthesis: row.judgeSummary !== null,
    };
  }

  async save(data: Omit<DebateEntity, "id" | "createdAt">): Promise<DebateEntity> {
    return this.prisma.debate.create({ data });
  }

  async updateStatus(id: string, status: string): Promise<DebateEntity> {
    return this.prisma.debate.update({ where: { id }, data: { status } });
  }

  async deleteWithCascade(id: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.debateMessage.deleteMany({ where: { debateId: id } }),
      this.prisma.round.deleteMany({ where: { debateId: id } }),
      this.prisma.analysisResult.deleteMany({ where: { debateId: id } }),
      this.prisma.judgeSummary.deleteMany({ where: { debateId: id } }),
      this.prisma.persona.deleteMany({ where: { debateId: id } }),
      this.prisma.debate.delete({ where: { id } }),
    ]);
  }
}

function extractKeyChanges(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object") {
        const obj = entry as Record<string, unknown>;
        if (typeof obj.title === "string") return obj.title;
        if (typeof obj.summary === "string") return obj.summary;
        if (typeof obj.text === "string") return obj.text;
      }
      return null;
    })
    .filter((entry): entry is string => entry !== null);
}
