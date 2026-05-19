import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import type { DebateListItemDto, DebateOverviewDto } from "@agora/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/auth.types";
import { DebateService } from "./debate.service";

@Controller("debates")
@UseGuards(JwtAuthGuard)
export class DebateController {
  constructor(private readonly debates: DebateService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<DebateListItemDto[]> {
    return this.debates.listForUser(user.userId);
  }

  @Get(":id/overview")
  overview(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DebateOverviewDto> {
    return this.debates.getOverview(id, user.userId);
  }
}
