import { Module } from "@nestjs/common";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";
import { PersonaAgentFactory } from "./domain/persona-agent-factory";
import { LLM_CLIENT } from "./domain/i-llm-client";
import { OpenAIStreamingClient } from "./infrastructure/openai-streaming-client";

@Module({
  controllers: [AgentController],
  providers: [
    AgentService,
    PersonaAgentFactory,
    {
      provide: LLM_CLIENT,
      useClass: OpenAIStreamingClient,
    },
  ],
  exports: [AgentService, PersonaAgentFactory, LLM_CLIENT],
})
export class AgentModule {}
