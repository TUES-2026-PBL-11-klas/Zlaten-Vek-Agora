import { Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import type { CreateDebateResponseDto } from "@agora/shared";
import { DebateStatus } from "@agora/shared";
import { AppException } from "../../common/exceptions/app.exception";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/auth.types";
import { DEBATE_REPOSITORY, IDebateRepository } from "../debate/domain/i-debate.repository";
import { DebateNotFoundException } from "../debate/domain/debate-not-found.exception";
import { Inject } from "@nestjs/common";
import { toPersonaDraftDto } from "../persona/persona.mapper";
import { AnalysisService } from "./analysis.service";
import { toAnalysisResultDto } from "./analysis.mapper";

@Controller("debates/:debateId/analysis")
@UseGuards(JwtAuthGuard)
export class AnalysisController {
  constructor(
    private readonly analysis: AnalysisService,
    @Inject(DEBATE_REPOSITORY) private readonly debates: IDebateRepository,
  ) {}

  @Post("retry")
  @HttpCode(HttpStatus.OK)
  async retry(
    @Param("debateId") debateId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CreateDebateResponseDto> {
    const debate = await this.debates.findById(debateId);
    if (!debate || debate.userId !== user.userId) {
      throw new DebateNotFoundException(debateId);
    }
    if (debate.status !== DebateStatus.AnalysisFailed && debate.status !== DebateStatus.Draft) {
      throw new AppException(
        `Debate ${debateId} cannot be re-analyzed (current: ${debate.status})`,
        400,
        "INVALID_DEBATE_STATUS",
      );
    }

    const { analysis, personas } = await this.analysis.analyze(debateId);
    return {
      debateId: debate.id,
      billTitle: debate.title,
      status: DebateStatus.PersonasPending,
      personas: personas.map(toPersonaDraftDto),
      analysis: toAnalysisResultDto(analysis),
    };
  }
}
