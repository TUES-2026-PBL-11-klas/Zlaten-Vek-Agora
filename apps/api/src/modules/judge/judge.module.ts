import { forwardRef, Module } from "@nestjs/common";
import { AgentModule } from "../agent/agent.module";
import { DebateModule } from "../debate/debate.module";
import { PersonaModule } from "../persona/persona.module";
import { JudgeController } from "./judge.controller";
import { JudgeService } from "./judge.service";

@Module({
  imports: [AgentModule, forwardRef(() => DebateModule), forwardRef(() => PersonaModule)],
  controllers: [JudgeController],
  providers: [JudgeService],
  exports: [JudgeService],
})
export class JudgeModule {}
