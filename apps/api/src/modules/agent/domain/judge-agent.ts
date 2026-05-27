import { AgentContext, LLMMessage } from "./agent-context";
import { BaseAgent } from "./base-agent";
import { ILLMClient } from "./i-llm-client";

const JUDGE_SYSTEM_PROMPT = `You are a neutral moderator synthesising a multi-stakeholder debate about proposed legislation.

Your task is to read the full debate transcript and produce a structured synthesis.

Return ONLY a valid JSON object — no markdown fences, no commentary — matching this exact shape:
{
  "contradictions": [
    "One sentence describing a genuine conflict between two parties' positions."
  ],
  "commonPoints": [
    "One sentence describing a view or concern shared by multiple parties."
  ],
  "compromises": [
    "One concrete amendment or policy change that could reduce friction between parties."
  ],
  "groupSummaries": {
    "Participant Name": "Two sentences summarising their core position and primary concern."
  }
}

RULES
- JSON keys MUST stay in English exactly as shown above.
- All string values MUST be written in Bulgarian.
- Provide 2-4 contradictions, 2-4 common points, and 2-3 compromises.
- Include every participant in groupSummaries — use their exact name as the key.
- Be specific: reference actual claims from the transcript, not generalities.
- Be balanced: do not favour any participant.`;

export class JudgeAgent extends BaseAgent {
  constructor(llmClient: ILLMClient) {
    super("judge", "Judge", llmClient);
  }

  async *generateResponse(context: AgentContext): AsyncIterable<string> {
    const debateTranscript = context.history.map((m) => m.content).join("\n\n");

    const messages: LLMMessage[] = [
      { role: "system", content: JUDGE_SYSTEM_PROMPT },
      {
        role: "user",
        content: `BILL TEXT\n${context.billText}\n\nDEBATE TRANSCRIPT\n${debateTranscript}\n\nProvide your synthesis now.`,
      },
    ];

    const stream = this.llmClient.streamCompletion(messages, {
      temperature: 0.2,
      responseFormat: { type: "json_object" },
    });

    for await (const token of stream) {
      yield token;
    }
  }
}
