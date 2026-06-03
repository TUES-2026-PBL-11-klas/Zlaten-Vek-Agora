import { RoundType, Emotion, EMOTIONS } from "@agora/shared";
import { PersonaEntity } from "../../persona/domain/persona.entity";
import { AgentContext, LLMMessage } from "./agent-context";
import { BaseAgent } from "./base-agent";
import { ILLMClient } from "./i-llm-client";

const ROUND_INSTRUCTIONS: Record<RoundType, string> = {
  [RoundType.Position]: `This is the Opening Statements round. Present your personal position on this legislation.
- State clearly which aspects you support and which you oppose.
- Tie your position to at least one of the contentious points listed in DEBATE CONTEXT.
- Ground every claim in your own lived experience, livelihood, or values.
- Be direct. Do not hedge or speak in generalities.`,

  [RoundType.Counter]: `This is the Rebuttal round. You have read what the other participants said.
- Challenge at least one specific argument made by another speaker. Quote or paraphrase their words.
- Anchor your attack on one of the contentious points in DEBATE CONTEXT.
- Explain precisely why their position is mistaken or incomplete from your perspective.
- You may acknowledge a narrow point of agreement, but lead with your disagreement.`,

  [RoundType.CommonGround]: `This is the Common Ground round. The goal is productive compromise.
- Identify at least one point you genuinely share with another participant.
- Propose a concrete amendment or compromise that addresses one of the contentious points.
- Be honest - do not abandon your core interests, but show willingness to negotiate.`,
};

function buildDebateContext(context: AgentContext): string {
  const sections: string[] = [];
  if (context.keyChanges && context.keyChanges.length > 0) {
    sections.push(
      `Key changes in the bill:\n${context.keyChanges.map((c) => `- ${c}`).join("\n")}`,
    );
  }
  if (context.contentiousPoints && context.contentiousPoints.length > 0) {
    sections.push(
      `Contentious points:\n${context.contentiousPoints.map((c) => `- ${c}`).join("\n")}`,
    );
  }
  if (context.personaStance) {
    sections.push(
      `YOUR STANCE: ${context.personaStance.stance} - ${context.personaStance.reason}\nArgue consistently from this stance.`,
    );
  }
  if (sections.length === 0) return "";
  return `\n\nDEBATE CONTEXT\n${sections.join("\n\n")}`;
}

function buildSystemPrompt(persona: PersonaEntity, context: AgentContext): string {
  const role = persona.role ? ` representing ${persona.role}` : "";
  return `You are ${persona.name}${role} - ${persona.demographic}.

CHARACTER PROFILE
- Interests: ${persona.interests.join("; ")}
- Fears: ${persona.fears.join("; ")}
- Priorities: ${persona.priorities.join("; ")}

DEBATE RULES
- Speak exclusively in Bulgarian (Cyrillic script), strictly in the first person ("аз", "моят"). Always speak about yourself as "I", never refer to yourself by your own name in the third person.
- Your name is ${persona.name}. Address other participants by their surname (e.g. "г-н Иванов", "г-ца Петрова"), but never narrate your own views in the third person.
- Stay fully in character. Never break the fourth wall or mention AI.
- Keep your response to 3-5 sentences: concise, concrete, and persuasive.
- Do not use em dashes; use hyphens instead.
- Start your reply directly - no preamble, no salutation.${buildDebateContext(context)}

ROUND INSTRUCTIONS
${ROUND_INSTRUCTIONS[context.roundType]}`;
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

  async classifyEmotion(text: string): Promise<Emotion> {
    const messages: LLMMessage[] = [
      {
        role: "system",
        content:
          "Classify the emotional tone of a Bulgarian debate speech. Reply with exactly one word from: calm, confident, pensive, anxious, tense. No other output.",
      },
      { role: "user", content: text },
    ];
    let result = "";
    for await (const token of this.llmClient.streamCompletion(messages, {
      temperature: 0,
      maxTokens: 5,
    })) {
      result += token;
    }
    const word = result.trim().toLowerCase() as Emotion;
    return EMOTIONS.includes(word) ? word : Emotion.Calm;
  }

  async *generateResponse(context: AgentContext): AsyncIterable<string> {
    const systemPrompt = buildSystemPrompt(this.personaEntity, context);

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
      maxTokens: 320,
    });

    for await (const token of stream) {
      yield token;
    }
  }
}
