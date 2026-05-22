import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import type {
  DebateChamberStatsDto,
  DebateDetailDto,
  DebateListItemDto,
  DebateOverviewDto,
  Paginated,
} from "@agora/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/auth.types";
import { DebateService } from "./debate.service";

const DEFAULT_PAGE_SIZE = 6;
const MAX_PAGE_SIZE = 100;

@Controller("debates")
@UseGuards(JwtAuthGuard)
export class DebateController {
  constructor(private readonly debates: DebateService) {}

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
