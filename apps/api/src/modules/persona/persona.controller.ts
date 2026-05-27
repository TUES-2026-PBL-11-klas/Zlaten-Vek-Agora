import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import type { PersonaDraftDto, UpdatePersonasResponseDto } from "@agora/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/auth.types";
import { PersonaService } from "./persona.service";
import { toPersonaDraftDto } from "./persona.mapper";
import { UpdatePersonasBodyDto } from "./dto/update-personas.dto";

@Controller("debates/:debateId/personas")
@UseGuards(JwtAuthGuard)
export class PersonaController {
  constructor(private readonly personas: PersonaService) {}

  @Get()
  async list(
    @Param("debateId") debateId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PersonaDraftDto[]> {
    const list = await this.personas.listForDebate(debateId, user.userId);
    return list.map(toPersonaDraftDto);
  }

  @Patch()
  async update(
    @Param("debateId") debateId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdatePersonasBodyDto,
  ): Promise<UpdatePersonasResponseDto> {
    const updated = await this.personas.updatePersonas(debateId, user.userId, body);
    return { personas: updated.map(toPersonaDraftDto) };
  }
}
