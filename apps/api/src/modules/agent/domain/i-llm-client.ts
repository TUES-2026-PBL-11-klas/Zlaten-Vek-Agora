import { LLMMessage, LLMOptions } from "./agent-context";

export const LLM_CLIENT = Symbol("ILLMClient");

export interface ILLMClient {
  streamCompletion(messages: LLMMessage[], options?: LLMOptions): AsyncIterable<string>;
}
