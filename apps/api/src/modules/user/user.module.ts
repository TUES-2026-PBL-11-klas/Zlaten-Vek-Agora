import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { PrismaUserRepository } from "./infrastructure/prisma-user.repository";
import { USER_REPOSITORY } from "./domain/i-user.repository";

@Module({
  controllers: [UserController],
  providers: [UserService, { provide: USER_REPOSITORY, useClass: PrismaUserRepository }],
  exports: [UserService, USER_REPOSITORY],
})
export class UserModule {}
