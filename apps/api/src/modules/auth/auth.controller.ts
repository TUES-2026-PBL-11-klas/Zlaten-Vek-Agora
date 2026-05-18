import { Controller, Get, UseGuards } from "@nestjs/common";
import type { AuthMeResponseDto } from "@agora/shared";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AuthenticatedUser } from "./auth.types";

@Controller("auth")
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("me")
  async me(@CurrentUser() user: AuthenticatedUser): Promise<AuthMeResponseDto> {
    const profile = await this.authService.getOrCreateUser(user.userId, user.email);
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      createdAt: profile.createdAt.toISOString(),
    };
  }
}
