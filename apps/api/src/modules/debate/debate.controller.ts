import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type {
  CreateDebateResponseDto,
  DebateChamberStatsDto,
  DebateDetailDto,
  DebateListItemDto,
  DebateOverviewDto,
  Paginated,
} from "@agora/shared";
import { DebateStatus } from "@agora/shared";
import { Logger } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/auth.types";
import { AnalysisService } from "../analysis/analysis.service";
import { toAnalysisResultDto } from "../analysis/analysis.mapper";
import { AnalysisFailedException } from "../../common/exceptions/analysis-failed.exception";
import { PersonaGenerationException } from "../../common/exceptions/persona-generation.exception";
import { toPersonaDraftDto } from "../persona/persona.mapper";
import { DebateService } from "./debate.service";
import { CreateDebateBodyDto } from "./dto/create-debate.dto";

const DEFAULT_PAGE_SIZE = 6;
const MAX_PAGE_SIZE = 100;

@Controller("debates")
@UseGuards(JwtAuthGuard)
export class DebateController {
  private readonly logger = new Logger(DebateController.name);

  constructor(
    private readonly debates: DebateService,
    private readonly analysis: AnalysisService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateDebateBodyDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CreateDebateResponseDto> {
    const draft = await this.debates.create(user.userId, body.billTitle, body.billText, file);

    try {
      const { analysis, personas } = await this.analysis.analyze(draft.debateId);
      return {
        debateId: draft.debateId,
        billTitle: draft.billTitle,
        status: DebateStatus.PersonasPending,
        personas: personas.map(toPersonaDraftDto),
        analysis: toAnalysisResultDto(analysis),
      };
    } catch (err) {
      if (err instanceof AnalysisFailedException || err instanceof PersonaGenerationException) {
        this.logger.warn(
          `Analysis failed for debate ${draft.debateId}, returning AnalysisFailed status: ${err.message}`,
        );
        return {
          debateId: draft.debateId,
          billTitle: draft.billTitle,
          status: DebateStatus.AnalysisFailed,
        };
      }
      throw err;
    }
  }

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ): Promise<Paginated<DebateListItemDto>> {
    return this.debates.listForUser(
      user.userId,
      parsePositiveInt(page, 1),
      Math.min(parsePositiveInt(pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE),
    );
  }

  @Get("me/chamber")
  chamber(@CurrentUser() user: AuthenticatedUser): Promise<DebateChamberStatsDto> {
    return this.debates.getChamberStats(user.userId);
  }

  @Get(":id/overview")
  overview(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DebateOverviewDto> {
    return this.debates.getOverview(id, user.userId);
  }

  @Get(":id")
  detail(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DebateDetailDto> {
    return this.debates.getDetail(id, user.userId);
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
