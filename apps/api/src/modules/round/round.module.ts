import { Module } from "@nestjs/common";
import { PrismaRoundRepository } from "./infrastructure/prisma-round.repository";
import { ROUND_REPOSITORY } from "./domain/i-round.repository";

@Module({
  providers: [{ provide: ROUND_REPOSITORY, useClass: PrismaRoundRepository }],
  exports: [ROUND_REPOSITORY],
})
export class RoundModule {}
