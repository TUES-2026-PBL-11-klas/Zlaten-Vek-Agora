import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UserEntity } from "../domain/user.entity";
import { IUserRepository } from "../domain/i-user.repository";

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async save(data: Omit<UserEntity, "id" | "createdAt">): Promise<UserEntity> {
    return this.prisma.user.create({ data });
  }

  async upsertById(id: string, data: { email: string; name: string }): Promise<UserEntity> {
    return this.prisma.user.upsert({
      where: { id },
      update: { email: data.email },
      create: { id, email: data.email, name: data.name },
    });
  }

  async updateName(id: string, name: string): Promise<UserEntity> {
    return this.prisma.user.update({ where: { id }, data: { name } });
  }

  async deleteWithCascade(id: string): Promise<void> {
    const debates = await this.prisma.debate.findMany({
      where: { userId: id },
      select: { id: true },
    });
    const debateIds = debates.map((d) => d.id);

    await this.prisma.$transaction([
      this.prisma.debateMessage.deleteMany({ where: { debateId: { in: debateIds } } }),
      this.prisma.round.deleteMany({ where: { debateId: { in: debateIds } } }),
      this.prisma.analysisResult.deleteMany({ where: { debateId: { in: debateIds } } }),
      this.prisma.judgeSummary.deleteMany({ where: { debateId: { in: debateIds } } }),
      this.prisma.persona.deleteMany({ where: { debateId: { in: debateIds } } }),
      this.prisma.debate.deleteMany({ where: { userId: id } }),
      this.prisma.user.delete({ where: { id } }),
    ]);
  }
}
