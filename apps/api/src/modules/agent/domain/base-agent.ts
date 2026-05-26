import { AgentContext } from "./agent-context";
import { IDebateAgent } from "./i-debate-agent";
import { ILLMClient } from "./i-llm-client";

export abstract class BaseAgent implements IDebateAgent {
  constructor(
    readonly id: string,
    protected readonly persona: string,
    protected readonly llmClient: ILLMClient,
  ) {}

  abstract generateResponse(context: AgentContext): AsyncIterable<string>;
}
