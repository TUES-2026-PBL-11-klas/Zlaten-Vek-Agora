import { Module } from "@nestjs/common";
import { UsersService } from "./application/users.service";
import { USER_REPOSITORY } from "./domain/user.repository";
import { InMemoryUserRepository } from "./infrastructure/in-memory-user.repository";
import { UsersController } from "./presentation/users.controller";

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: USER_REPOSITORY, useClass: InMemoryUserRepository },
  ],
  exports: [UsersService],
})
export class UsersModule {}
