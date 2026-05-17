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
}
