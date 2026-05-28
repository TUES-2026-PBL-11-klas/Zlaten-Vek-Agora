import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import type { SynthesisDto } from "@agora/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/auth.types";
import { JudgeService } from "./judge.service";

@Controller("debates")
@UseGuards(JwtAuthGuard)
export class JudgeController {
  constructor(private readonly judge: JudgeService) {}

  @Get(":id/synthesis")
  synthesis(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SynthesisDto> {
    return this.judge.getSynthesis(id, user.userId);
  }
}
