export type DebateEvent =
  | { type: "round_start"; data: { roundNumber: number; phase: string } }
  | { type: "persona_start"; data: { personaId: string; personaName: string } }
  | { type: "token"; data: { personaId: string; token: string } }
  | {
      type: "persona_end";
      data: { personaId: string; messageId: string; emotion: string };
    }
  | { type: "round_end"; data: { roundNumber: number } }
  | { type: "judge_start"; data: Record<string, never> }
  | { type: "judge_token"; data: { token: string } }
  | { type: "debate_complete"; data: { summaryId: string } }
  | { type: "error"; data: { message: string } };
