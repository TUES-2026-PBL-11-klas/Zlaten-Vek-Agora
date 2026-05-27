import { RoundType } from "@agora/shared";
import { PersonaEntity } from "../../persona/domain/persona.entity";
import { AgentContext, LLMMessage } from "./agent-context";
import { BaseAgent } from "./base-agent";
import { ILLMClient } from "./i-llm-client";

const ROUND_INSTRUCTIONS: Record<RoundType, string> = {
  [RoundType.Position]: `This is the Opening Statements round. Present your personal position on this legislation.
- State clearly which aspects you support and which you oppose.
- Ground every claim in your own lived experience, livelihood, or values.
- Be direct. Do not hedge or speak in generalities.`,

  [RoundType.Counter]: `This is the Rebuttal round. You have read what the other participants said.
- Challenge at least one specific argument made by another speaker. Quote or paraphrase their words.
- Explain precisely why their position is mistaken or incomplete from your perspective.
- You may acknowledge a narrow point of agreement, but lead with your disagreement.`,

  [RoundType.CommonGround]: `This is the Common Ground round. The goal is productive compromise.
- Identify at least one point you genuinely share with another participant.
- Propose a concrete amendment or compromise that could satisfy more stakeholders.
- Be honest — do not abandon your core interests, but show willingness to negotiate.`,
};

function buildSystemPrompt(persona: PersonaEntity, roundType: RoundType): string {
  return `You are ${persona.name} — ${persona.demographic}.

CHARACTER PROFILE
- Interests: ${persona.interests.join("; ")}
- Fears: ${persona.fears.join("; ")}
- Priorities: ${persona.priorities.join("; ")}

DEBATE RULES
- Speak exclusively in Bulgarian (Cyrillic script), in the first person.
- Stay fully in character. Never break the fourth wall or mention AI.
- Keep your response to 3-5 sentences: concise, concrete, and persuasive.
- Start your reply directly — no preamble, no salutation.

ROUND INSTRUCTIONS
${ROUND_INSTRUCTIONS[roundType]}`;
}

export class PersonaAgent extends BaseAgent {
  private readonly personaEntity: PersonaEntity;

  constructor(persona: PersonaEntity, llmClient: ILLMClient) {
    super(persona.id, persona.name, llmClient);
    this.personaEntity = persona;
  }

  get personaName(): string {
    return this.personaEntity.name;
  }

  async *generateResponse(context: AgentContext): AsyncIterable<string> {
    const systemPrompt = buildSystemPrompt(this.personaEntity, context.roundType);

    // Fold bill + debate history into a single user message to avoid consecutive
    // assistant-role entries, which the OpenAI API rejects.
    const historyBlock =
      context.history.length > 0
        ? `\n\nDEBATE SO FAR\n${context.history.map((m) => m.content).join("\n\n")}`
        : "";

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `BILL TEXT\n${context.billText}${historyBlock}\n\nNow give your statement.`,
      },
    ];

    const stream = this.llmClient.streamCompletion(messages, {
      temperature: 0.8,
    });

    for await (const token of stream) {
      yield token;
    }
  }
}
