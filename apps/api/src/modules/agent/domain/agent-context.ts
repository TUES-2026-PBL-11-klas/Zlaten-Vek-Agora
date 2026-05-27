export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  responseFormat?: { type: "json_object" | "text" };
}

export interface AgentContext {
  billText: string;
  persona?: string;
  history: LLMMessage[];
  roundNumber: number;
}
