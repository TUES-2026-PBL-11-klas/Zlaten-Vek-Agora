import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { DebateMessageEntity } from "../domain/debate.entity";
import { IDebateMessageRepository } from "../domain/i-debate-message.repository";

@Injectable()
export class PrismaDebateMessageRepository implements IDebateMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDebate(debateId: string): Promise<DebateMessageEntity[]> {
    return this.prisma.debateMessage.findMany({
      where: { debateId },
      include: { persona: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async findByRound(roundId: string): Promise<DebateMessageEntity[]> {
    return this.prisma.debateMessage.findMany({
      where: { roundId },
      include: { persona: true },
      orderBy: { sequence: "asc" },
    });
  }

  async append(
    data: Omit<DebateMessageEntity, "id" | "createdAt" | "persona">,
  ): Promise<DebateMessageEntity> {
    return this.prisma.debateMessage.create({ data, include: { persona: true } });
  }
}
