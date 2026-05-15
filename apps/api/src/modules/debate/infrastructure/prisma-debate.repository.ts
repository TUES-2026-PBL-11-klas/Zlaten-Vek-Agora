import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { DebateEntity } from "../domain/debate.entity";
import { IDebateRepository } from "../domain/i-debate.repository";

@Injectable()
export class PrismaDebateRepository implements IDebateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<DebateEntity | null> {
    return this.prisma.debate.findUnique({ where: { id } });
  }

  async findByUser(userId: string): Promise<DebateEntity[]> {
    return this.prisma.debate.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async save(data: Omit<DebateEntity, "id" | "createdAt">): Promise<DebateEntity> {
    return this.prisma.debate.create({ data });
  }

  async updateStatus(id: string, status: string): Promise<DebateEntity> {
    return this.prisma.debate.update({ where: { id }, data: { status } });
  }
}
