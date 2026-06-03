import { forwardRef, Module } from "@nestjs/common";
import { AgentModule } from "../agent/agent.module";
import { DebateModule } from "../debate/debate.module";
import { PersonaModule } from "../persona/persona.module";
import { AnalysisController } from "./analysis.controller";
import { AnalysisService } from "./analysis.service";
import { ANALYSIS_RESULT_REPOSITORY } from "./domain/i-analysis-result.repository";
import { PrismaAnalysisResultRepository } from "./infrastructure/prisma-analysis-result.repository";

@Module({
  imports: [AgentModule, PersonaModule, forwardRef(() => DebateModule)],
  controllers: [AnalysisController],
  providers: [
    AnalysisService,
    { provide: ANALYSIS_RESULT_REPOSITORY, useClass: PrismaAnalysisResultRepository },
  ],
  exports: [AnalysisService, ANALYSIS_RESULT_REPOSITORY],
})
export class AnalysisModule {}
