import { Inject, Injectable } from "@nestjs/common";
import { DebateStatus, type UpdatePersonasRequestDto } from "@agora/shared";
import { AppException } from "../../common/exceptions/app.exception";
import { DebateNotFoundException } from "../debate/domain/debate-not-found.exception";
import { DEBATE_REPOSITORY, IDebateRepository } from "../debate/domain/i-debate.repository";
import { IPersonaRepository, PERSONA_REPOSITORY } from "./domain/i-persona.repository";
import { PersonaEntity } from "./domain/persona.entity";
import { assignColor } from "../analysis/domain/persona-colors";

@Injectable()
export class PersonaService {
  constructor(
    @Inject(PERSONA_REPOSITORY) private readonly personas: IPersonaRepository,
    @Inject(DEBATE_REPOSITORY) private readonly debates: IDebateRepository,
  ) {}

  async listForDebate(debateId: string, userId: string): Promise<PersonaEntity[]> {
    await this.requireOwnedDebate(debateId, userId);
    return this.personas.findByDebate(debateId);
  }

  async updatePersonas(
    debateId: string,
    userId: string,
    request: UpdatePersonasRequestDto,
  ): Promise<PersonaEntity[]> {
    const debate = await this.requireOwnedDebate(debateId, userId);
    if (debate.status !== DebateStatus.PersonasPending) {
      throw new AppException(
        `Personas can only be edited while debate is in personas_pending status (current: ${debate.status})`,
        400,
        "INVALID_DEBATE_STATUS",
      );
    }

    if (request.remove && request.remove.length > 0) {
      await this.personas.deleteMany(request.remove);
    }

    if (request.update && request.update.length > 0) {
      await this.personas.updateMany(request.update);
    }

    if (request.add && request.add.length > 0) {
      const existingCount = (await this.personas.findByDebate(debateId)).length;
      const additions = request.add.map((p, i) => ({
        debateId,
        name: p.name,
        role: p.role,
        demographic: p.demographic,
        interests: p.interests,
        fears: p.fears,
        priorities: p.priorities,
        color: p.color ?? assignColor(existingCount + i),
        avatarUrl: p.avatarUrl ?? null,
      }));
      await this.personas.saveMany(additions);
    }

    return this.personas.findByDebate(debateId);
  }

  private async requireOwnedDebate(debateId: string, userId: string) {
    const debate = await this.debates.findById(debateId);
    if (!debate || debate.userId !== userId) {
      throw new DebateNotFoundException(debateId);
    }
    return debate;
  }
}
