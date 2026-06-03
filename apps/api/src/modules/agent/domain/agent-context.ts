import { RoundType } from "@agora/shared";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" | "text" };
}

export interface RosterEntry {
  id: string;
  name: string;
}

export interface AgentContext {
  billText: string;
  persona?: string;
  history: LLMMessage[];
  roundNumber: number;
  roundType: RoundType;
  /** Bill-wide fault lines from analysis, shared by all personas. */
  contentiousPoints?: string[];
  /** Headline changes the bill introduces, from analysis. */
  keyChanges?: string[];
  /** The speaking persona's own assigned stance from analysis. */
  personaStance?: { stance: string; reason: string };
  /** Persona id/name roster, supplied to the judge for exact id matching. */
  roster?: RosterEntry[];
}
