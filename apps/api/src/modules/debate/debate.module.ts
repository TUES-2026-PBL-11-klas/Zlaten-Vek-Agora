import { Module } from "@nestjs/common";
import { DebateController } from "./debate.controller";
import { DebateService } from "./debate.service";
import { PrismaDebateRepository } from "./infrastructure/prisma-debate.repository";
import { PrismaDebateMessageRepository } from "./infrastructure/prisma-debate-message.repository";
import { DEBATE_REPOSITORY } from "./domain/i-debate.repository";
import { DEBATE_MESSAGE_REPOSITORY } from "./domain/i-debate-message.repository";

@Module({
  controllers: [DebateController],
  providers: [
    DebateService,
    { provide: DEBATE_REPOSITORY, useClass: PrismaDebateRepository },
    { provide: DEBATE_MESSAGE_REPOSITORY, useClass: PrismaDebateMessageRepository },
  ],
  exports: [DebateService, DEBATE_REPOSITORY, DEBATE_MESSAGE_REPOSITORY],
})
export class DebateModule {}
