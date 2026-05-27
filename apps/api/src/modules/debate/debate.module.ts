import { forwardRef, Module } from "@nestjs/common";
import { AgentModule } from "../agent/agent.module";
import { AnalysisModule } from "../analysis/analysis.module";
import { PersonaModule } from "../persona/persona.module";
import { AgentOrchestrator } from "./application/agent-orchestrator";
import { DebateController } from "./debate.controller";
import { DebateService } from "./debate.service";
import { BILL_TEXT_EXTRACTOR } from "./domain/bill-text-extractor";
import { DEBATE_REPOSITORY } from "./domain/i-debate.repository";
import { DEBATE_MESSAGE_REPOSITORY } from "./domain/i-debate-message.repository";
import { JUDGE_SUMMARY_REPOSITORY } from "./domain/i-judge-summary.repository";
import { ROUND_REPOSITORY } from "./domain/i-round.repository";
import { PdfBillTextExtractor } from "./infrastructure/pdf-bill-text-extractor";
import { PrismaDebateRepository } from "./infrastructure/prisma-debate.repository";
import { PrismaDebateMessageRepository } from "./infrastructure/prisma-debate-message.repository";
import { PrismaJudgeSummaryRepository } from "./infrastructure/prisma-judge-summary.repository";
import { PrismaRoundRepository } from "./infrastructure/prisma-round.repository";

@Module({
  imports: [AgentModule, forwardRef(() => AnalysisModule), forwardRef(() => PersonaModule)],
  controllers: [DebateController],
  providers: [
    DebateService,
    AgentOrchestrator,
    { provide: DEBATE_REPOSITORY, useClass: PrismaDebateRepository },
    { provide: DEBATE_MESSAGE_REPOSITORY, useClass: PrismaDebateMessageRepository },
    { provide: BILL_TEXT_EXTRACTOR, useClass: PdfBillTextExtractor },
    { provide: ROUND_REPOSITORY, useClass: PrismaRoundRepository },
    { provide: JUDGE_SUMMARY_REPOSITORY, useClass: PrismaJudgeSummaryRepository },
  ],
  exports: [DebateService, AgentOrchestrator, DEBATE_REPOSITORY, DEBATE_MESSAGE_REPOSITORY],
})
export class DebateModule {}
