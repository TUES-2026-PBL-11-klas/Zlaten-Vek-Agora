import { forwardRef, Module } from "@nestjs/common";
import { AnalysisModule } from "../analysis/analysis.module";
import { DebateController } from "./debate.controller";
import { DebateService } from "./debate.service";
import { BILL_TEXT_EXTRACTOR } from "./domain/bill-text-extractor";
import { DEBATE_REPOSITORY } from "./domain/i-debate.repository";
import { DEBATE_MESSAGE_REPOSITORY } from "./domain/i-debate-message.repository";
import { PdfBillTextExtractor } from "./infrastructure/pdf-bill-text-extractor";
import { PrismaDebateRepository } from "./infrastructure/prisma-debate.repository";
import { PrismaDebateMessageRepository } from "./infrastructure/prisma-debate-message.repository";

@Module({
  imports: [forwardRef(() => AnalysisModule)],
  controllers: [DebateController],
  providers: [
    DebateService,
    { provide: DEBATE_REPOSITORY, useClass: PrismaDebateRepository },
    { provide: DEBATE_MESSAGE_REPOSITORY, useClass: PrismaDebateMessageRepository },
    { provide: BILL_TEXT_EXTRACTOR, useClass: PdfBillTextExtractor },
  ],
  exports: [DebateService, DEBATE_REPOSITORY, DEBATE_MESSAGE_REPOSITORY],
})
export class DebateModule {}
