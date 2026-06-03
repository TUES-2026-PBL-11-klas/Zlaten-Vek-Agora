import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { IsString, MinLength, MaxLength } from "class-validator";
import type { AuthMeResponseDto, UpdateProfileRequestDto } from "@agora/shared";
import { UserService } from "./user.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/auth.types";

class UpdateProfileBody implements UpdateProfileRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name!: string;
}

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("me")
  async me(@CurrentUser() user: AuthenticatedUser): Promise<AuthMeResponseDto> {
    const profile = await this.userService.getProfile(user.userId);
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      createdAt: profile.createdAt.toISOString(),
    };
  }

  @Patch("me")
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProfileBody,
  ): Promise<AuthMeResponseDto> {
    const profile = await this.userService.updateName(user.userId, body.name);
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      createdAt: profile.createdAt.toISOString(),
    };
  }

  @Delete("me")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.userService.deleteAccount(user.userId);
  }
}
