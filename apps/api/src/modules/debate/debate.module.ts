import { Module } from "@nestjs/common";
import { DebateController } from "./debate.controller";
import { DebateService } from "./debate.service";

@Module({
  controllers: [DebateController],
  providers: [DebateService],
  exports: [DebateService],
})
export class DebateModule {}
