import { Inject, Injectable } from "@nestjs/common";
import { PersonaEntity } from "../../persona/domain/persona.entity";
import { JudgeAgent } from "./judge-agent";
import { ILLMClient, LLM_CLIENT } from "./i-llm-client";
import { PersonaAgent } from "./persona-agent";

@Injectable()
export class PersonaAgentFactory {
  constructor(@Inject(LLM_CLIENT) private readonly llm: ILLMClient) {}

  create(persona: PersonaEntity): PersonaAgent {
    return new PersonaAgent(persona, this.llm);
  }

  createJudge(): JudgeAgent {
    return new JudgeAgent(this.llm);
  }
}
