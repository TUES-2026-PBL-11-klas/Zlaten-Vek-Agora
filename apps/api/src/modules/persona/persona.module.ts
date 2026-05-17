import { Module } from "@nestjs/common";
import { PersonaController } from "./persona.controller";
import { PersonaService } from "./persona.service";
import { PrismaPersonaRepository } from "./infrastructure/prisma-persona.repository";
import { PERSONA_REPOSITORY } from "./domain/i-persona.repository";

@Module({
  controllers: [PersonaController],
  providers: [PersonaService, { provide: PERSONA_REPOSITORY, useClass: PrismaPersonaRepository }],
  exports: [PersonaService, PERSONA_REPOSITORY],
})
export class PersonaModule {}
