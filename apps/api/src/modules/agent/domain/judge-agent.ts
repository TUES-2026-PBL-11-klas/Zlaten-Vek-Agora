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
- participantShifts: exactly one entry per persona in the supplied ROSTER, in roster order. Each personaId MUST be copied verbatim from the ROSTER ids - never invent or alter an id, never use a persona name as the id.
- shiftPercent: integer; 0 means unmoved, 100 means a full pivot. Anchor in evidence from the transcript.
- closingStatement: civic, calm, lowercase phrasing ending with a period. Use hyphens, not em dashes.
- Return ONLY the JSON object. No markdown fences, no preamble, no trailing commentary.`;

export class JudgeAgent extends BaseAgent {
  constructor(llmClient: ILLMClient) {
    super("judge", JUDGE_PERSONA, llmClient);
  }

  async *generateResponse(context: AgentContext): AsyncIterable<string> {
    const roster = context.roster ?? [];
    const rosterBlock =
      roster.length > 0
        ? `ROSTER (use these exact personaId values, one participantShifts entry per row, in this order):\n${roster
            .map((r) => `- ${r.id} = ${r.name}`)
            .join("\n")}`
        : "ROSTER: (none supplied)";

    const messages: LLMMessage[] = [
      { role: "system", content: JUDGE_SYSTEM_PROMPT },
      { role: "user", content: rosterBlock },
      ...context.history,
      { role: "user", content: "Provide your structured synthesis now as a JSON object." },
    ];

    const stream = this.llmClient.streamCompletion(messages, {
      temperature: 0.3,
      maxTokens: 2000,
      responseFormat: { type: "json_object" },
    });

    for await (const token of stream) {
      yield token;
    }
  }
}

export const JUDGE_PERSONA_LABEL = JUDGE_PERSONA;
