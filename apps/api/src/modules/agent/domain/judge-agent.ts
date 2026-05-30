import { AgentContext, LLMMessage } from "./agent-context";
import { BaseAgent } from "./base-agent";
import { ILLMClient } from "./i-llm-client";

const JUDGE_PERSONA = "Impartial parliamentary mediator";

const JUDGE_SYSTEM_PROMPT = `You are an impartial parliamentary mediator synthesising a structured debate transcript on a legislative bill.

You must produce a JSON object with EXACTLY this shape and no additional keys:

{
  "contradictions": ["...", "...", "..."],
  "commonGround": ["...", "...", "..."],
  "compromise": ["...", "...", "..."],
  "participantShifts": [
    {
      "personaId": "<exact persona id from the roster>",
      "openedQuote": "<a short verbatim or paraphrased line from this persona's Round 1 contribution>",
      "closedQuote": "<a short verbatim or paraphrased line from this persona's Round 3 contribution>",
      "shiftPercent": <integer between 0 and 100 estimating how far this persona moved from their opening stance>
    }
  ],
  "closingStatement": "<one neutral, civic sentence delivered as the mediator's closing remark>"
}

Strict rules:
- contradictions: exactly 3 numbered fault lines, each a single sentence describing where positions clashed.
- commonGround: exactly 3 single-sentence agreements that genuinely emerged across the table.
- compromise: exactly 3 actionable proposals describing the shape of a workable settlement.
- participantShifts: one entry per persona in the supplied roster, in roster order, each personaId matching exactly.
- shiftPercent: integer; 0 means unmoved, 100 means a full pivot. Anchor in evidence from the transcript.
- closingStatement: civic, calm, lowercase phrasing ending with a period. Do not use em dashes.
- Return ONLY the JSON object. No markdown fences, no preamble, no trailing commentary.`;

export class JudgeAgent extends BaseAgent {
  constructor(llmClient: ILLMClient) {
    super("judge", JUDGE_PERSONA, llmClient);
  }

  async *generateResponse(context: AgentContext): AsyncIterable<string> {
    const messages: LLMMessage[] = [
      { role: "system", content: JUDGE_SYSTEM_PROMPT },
      ...context.history,
    ];

    const stream = this.llmClient.streamCompletion(messages, {
      temperature: 0.3,
      responseFormat: { type: "json_object" },
    });

    for await (const token of stream) {
      yield token;
    }
  }
}

export const JUDGE_PERSONA_LABEL = JUDGE_PERSONA;
