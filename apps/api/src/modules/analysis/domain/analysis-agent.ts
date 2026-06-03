import { AgentContext, LLMMessage } from "../../agent/domain/agent-context";
import { BaseAgent } from "../../agent/domain/base-agent";
import { ILLMClient } from "../../agent/domain/i-llm-client";

export const ANALYSIS_SYSTEM_PROMPT = `You are an expert legislative analyst.
The bill text provided may be written in Bulgarian. Analyse it and extract 4-6 distinct groups directly affected by this legislation.

Return ONLY a valid JSON object (no markdown, no commentary) with this exact shape:
{
  "groups": [
    {
      "id": "snake_case_slug",
      "name": "Кратко наименование на групата",
      "personName": "Г. Фамилия",
      "estimatedPopulation": "~X million / ~X,000",
      "demographics": "Възраст, доход, регион, заетост",
      "interests": ["интерес 1", "интерес 2"],
      "fears": ["опасение 1", "опасение 2", "опасение 3"],
      "priorities": ["приоритет 1", "приоритет 2", "приоритет 3"],
      "stance": "Supportive | Opposed | Mixed",
      "stanceReason": "Едно изречение обяснение"
    }
  ],
  "keyChanges": ["промяна 1", "промяна 2"],
  "contentiousPoints": ["спорна точка 1", "спорна точка 2"]
}

Rules:
- JSON keys MUST stay in English exactly as shown.
- All human-readable values (name, personName, demographics, interests, fears, priorities, stanceReason, keyChanges, contentiousPoints) MUST be in Bulgarian to match the UI.
- "name" is the group label (e.g. "Пенсионери", "Работодатели").
- "personName" is a single fictional Bulgarian representative who will speak for the group in the debate. Format MUST be one given-name initial + a full surname, e.g. "Г. Иванов", "М. Петрова". Vary gender and surname per group; the surname MUST be distinct across all groups so speakers can address each other by surname.
- "id" stays in snake_case ASCII.
- "stance" MUST be one of: Supportive, Opposed, Mixed.
- Provide 4-6 groups, 3-6 keyChanges, 2-5 contentiousPoints.`;

export class AnalysisAgent extends BaseAgent {
  constructor(llmClient: ILLMClient) {
    super("analysis-agent", "", llmClient);
  }

  async *generateResponse(context: AgentContext): AsyncIterable<string> {
    const messages: LLMMessage[] = [
      { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
      { role: "user", content: `Bill text:\n\n${context.billText}` },
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
