import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { LLM_CLIENT } from './domain/i-llm-client';
import { OpenAIStreamingClient } from './infrastructure/openai-streaming-client';

@Module({
  controllers: [AgentController],
  providers: [
    AgentService,
    {
      provide: LLM_CLIENT,
      useClass: OpenAIStreamingClient,
    },
  ],
  exports: [AgentService, LLM_CLIENT],
})
export class AgentModule {}
