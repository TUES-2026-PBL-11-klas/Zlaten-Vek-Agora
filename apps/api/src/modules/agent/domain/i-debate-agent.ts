import { AgentContext } from "./agent-context";

/**
 * Strategy pattern entry point. Every agent (Persona, Judge, Analysis)
 * implements this interface so the orchestrator treats them uniformly.
 */
export interface IDebateAgent {
  readonly id: string;
  generateResponse(context: AgentContext): AsyncIterable<string>;
}
