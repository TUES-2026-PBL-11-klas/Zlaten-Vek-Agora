import { Inject, Injectable, Logger } from "@nestjs/common";
import { RoundType, type SynthesisDto } from "@agora/shared";
import { LLM_CLIENT } from "../agent/domain/i-llm-client";
import type { ILLMClient } from "../agent/domain/i-llm-client";
import type { AgentContext, LLMMessage } from "../agent/domain/agent-context";
import { JudgeAgent } from "../agent/domain/judge-agent";
import { DEBATE_REPOSITORY, IDebateRepository } from "../debate/domain/i-debate.repository";
import {
  DEBATE_MESSAGE_REPOSITORY,
  IDebateMessageRepository,
} from "../debate/domain/i-debate-message.repository";
import { DebateNotFoundException } from "../debate/domain/debate-not-found.exception";
import { DebateMessageEntity } from "../debate/domain/debate.entity";
import {
  JUDGE_SUMMARY_REPOSITORY,
  IJudgeSummaryRepository,
} from "../debate/domain/i-judge-summary.repository";
import { JudgeSummaryEntity, ParticipantShift } from "../debate/domain/judge-summary.entity";
import { PERSONA_REPOSITORY } from "../persona/domain/i-persona.repository";
import type { IPersonaRepository } from "../persona/domain/i-persona.repository";
import { PersonaEntity } from "../persona/domain/persona.entity";
import { JudgeNotReadyException } from "./domain/judge-not-ready.exception";
import { JudgeSynthesisException } from "./domain/judge-synthesis.exception";

const REQUIRED_ROUND_COUNT = 3;

@Injectable()
export class JudgeService {
  private readonly logger = new Logger(JudgeService.name);

  constructor(
    @Inject(DEBATE_REPOSITORY) private readonly debates: IDebateRepository,
    @Inject(DEBATE_MESSAGE_REPOSITORY) private readonly messages: IDebateMessageRepository,
    @Inject(PERSONA_REPOSITORY) private readonly personas: IPersonaRepository,
    @Inject(JUDGE_SUMMARY_REPOSITORY)
    private readonly conclusions: IJudgeSummaryRepository,
    @Inject(LLM_CLIENT) private readonly llmClient: ILLMClient,
  ) {}

  async getSynthesis(debateId: string, userId: string): Promise<SynthesisDto> {
    const debate = await this.debates.findById(debateId);
    if (!debate || debate.userId !== userId) {
      throw new DebateNotFoundException(debateId);
    }

    const personas = await this.personas.findByDebate(debateId);
    const personaIndex = indexPersonas(personas);

    const existing = await this.conclusions.findByDebate(debateId);
    if (existing) {
      return toSynthesisDto(
        debate.title,
        debate.createdAt,
        existing,
        personaIndex,
        isFailed(existing),
      );
    }

    const overview = await this.debates.findOverviewById(debateId);
    if (!overview) throw new DebateNotFoundException(debateId);
    if (overview.rounds.completed < REQUIRED_ROUND_COUNT) {
      throw new JudgeNotReadyException(debateId, overview.rounds.completed);
    }

    const messages = await this.messages.findByDebate(debateId);
    const parsed = await this.invokeAgent(debateId, debate.billText, personas, messages);
    const validated = validateAndShape(parsed, personas);

    const saved = await this.conclusions.save({
      debateId,
      contradictions: validated.contradictions,
      commonGround: validated.commonGround,
      compromise: validated.compromise,
      participantShifts: validated.participantShifts,
      closingStatement: validated.closingStatement,
    });

    return toSynthesisDto(debate.title, debate.createdAt, saved, personaIndex, false);
  }

  async regenerateSynthesis(debateId: string, userId: string): Promise<SynthesisDto> {
    const debate = await this.debates.findById(debateId);
    if (!debate || debate.userId !== userId) {
      throw new DebateNotFoundException(debateId);
    }

    await this.conclusions.deleteByDebate(debateId);

    const personas = await this.personas.findByDebate(debateId);
    const personaIndex = indexPersonas(personas);
    const messages = await this.messages.findByDebate(debateId);
    const parsed = await this.invokeAgent(debateId, debate.billText, personas, messages);
    const validated = validateAndShape(parsed, personas);

    const saved = await this.conclusions.save({
      debateId,
      contradictions: validated.contradictions,
      commonGround: validated.commonGround,
      compromise: validated.compromise,
      participantShifts: validated.participantShifts,
      closingStatement: validated.closingStatement,
    });

    return toSynthesisDto(debate.title, debate.createdAt, saved, personaIndex, false);
  }

  private async invokeAgent(
    debateId: string,
    billText: string,
    personas: PersonaEntity[],
    messages: DebateMessageEntity[],
  ): Promise<unknown> {
    const transcript = buildTranscriptPrompt(billText, personas, messages);
    const context: AgentContext = {
      billText,
      history: [{ role: "user", content: transcript } satisfies LLMMessage],
      roundNumber: REQUIRED_ROUND_COUNT + 1,
      roundType: RoundType.CommonGround,
    };

    const agent = new JudgeAgent(this.llmClient);

    let buffer = "";
    for await (const token of agent.generateResponse(context)) {
      buffer += token;
    }

    try {
      return JSON.parse(buffer);
    } catch (error) {
      this.logger.error(
        `JudgeAgent returned non-JSON output for debate ${debateId}: ${truncate(buffer)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new JudgeSynthesisException("agent returned non-JSON output");
    }
  }
}

function buildTranscriptPrompt(
  billText: string,
  personas: PersonaEntity[],
  messages: DebateMessageEntity[],
): string {
  const roster = personas.map((p) => `- [${p.id}] ${p.name} - ${p.demographic}`).join("\n");

  const byRound = new Map<number, DebateMessageEntity[]>();
  for (const message of messages) {
    const round = message.round.roundNumber;
    const bucket = byRound.get(round) ?? [];
    bucket.push(message);
    byRound.set(round, bucket);
  }

  const roundSections: string[] = [];
  for (const round of [...byRound.keys()].sort((a, b) => a - b)) {
    const turns = (byRound.get(round) ?? [])
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
      .map((message) => `- ${message.persona.name} [${message.persona.id}]: ${message.content}`)
      .join("\n");
    roundSections.push(`Round ${round}\n${turns}`);
  }

  return [
    "=== Personas (roster) ===",
    roster,
    "",
    "=== Bill text ===",
    billText.trim(),
    "",
    "=== Transcript ===",
    roundSections.join("\n\n"),
  ].join("\n");
}

interface ValidatedConclusion {
  contradictions: string[];
  commonGround: string[];
  compromise: string[];
  participantShifts: ParticipantShift[];
  closingStatement: string;
}

function validateAndShape(payload: unknown, personas: PersonaEntity[]): ValidatedConclusion {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new JudgeSynthesisException("agent output is not an object");
  }
  const obj = payload as Record<string, unknown>;

  const contradictions = expectStringTriple(obj.contradictions, "contradictions");
  const commonGround = expectStringTriple(obj.commonGround, "commonGround");
  const compromise = expectStringTriple(obj.compromise, "compromise");
  const closingStatement = expectNonEmptyString(obj.closingStatement, "closingStatement");
  const participantShifts = expectShifts(obj.participantShifts, personas);

  return { contradictions, commonGround, compromise, participantShifts, closingStatement };
}

function expectStringTriple(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length !== 3) {
    throw new JudgeSynthesisException(`${field} must be an array of 3 strings`);
  }
  const cleaned: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string" || entry.trim().length === 0) {
      throw new JudgeSynthesisException(`${field} entries must be non-empty strings`);
    }
    cleaned.push(entry.trim());
  }
  return cleaned;
}

function expectNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new JudgeSynthesisException(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function expectShifts(value: unknown, personas: PersonaEntity[]): ParticipantShift[] {
  if (!Array.isArray(value)) {
    throw new JudgeSynthesisException("participantShifts must be an array");
  }
  const validIds = new Set(personas.map((p) => p.id));
  const seen = new Set<string>();
  const shifts: ParticipantShift[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new JudgeSynthesisException("participantShifts entries must be objects");
    }
    const item = entry as Record<string, unknown>;
    if (typeof item.personaId !== "string" || !validIds.has(item.personaId)) {
      throw new JudgeSynthesisException(`participantShifts has unknown personaId`);
    }
    if (seen.has(item.personaId)) continue;
    seen.add(item.personaId);

    const opened = expectNonEmptyString(item.openedQuote, "participantShifts.openedQuote");
    const closed = expectNonEmptyString(item.closedQuote, "participantShifts.closedQuote");
    const rawShift = item.shiftPercent;
    if (typeof rawShift !== "number" || Number.isNaN(rawShift)) {
      throw new JudgeSynthesisException("participantShifts.shiftPercent must be a number");
    }
    const shiftPercent = clamp(Math.round(rawShift), 0, 100);

    shifts.push({
      personaId: item.personaId,
      openedQuote: opened,
      closedQuote: closed,
      shiftPercent,
    });
  }

  if (shifts.length !== personas.length) {
    throw new JudgeSynthesisException(
      `participantShifts must have one entry per persona (got ${shifts.length}, expected ${personas.length})`,
    );
  }

  const order = new Map(personas.map((p, idx) => [p.id, idx]));
  shifts.sort((a, b) => (order.get(a.personaId) ?? 0) - (order.get(b.personaId) ?? 0));
  return shifts;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function indexPersonas(personas: PersonaEntity[]): Map<string, PersonaEntity> {
  return new Map(personas.map((p) => [p.id, p]));
}

function isFailed(summary: JudgeSummaryEntity): boolean {
  return summary.closingStatement === "" && summary.contradictions.length === 0;
}

function toSynthesisDto(
  title: string,
  createdAt: Date,
  conclusion: JudgeSummaryEntity,
  personaIndex: Map<string, PersonaEntity>,
  failed: boolean,
): SynthesisDto {
  return {
    debateId: conclusion.debateId,
    title,
    createdAt: createdAt.toISOString(),
    contradictions: conclusion.contradictions,
    commonGround: conclusion.commonGround,
    compromise: conclusion.compromise,
    closingStatement: conclusion.closingStatement,
    failed,
    participantShifts: conclusion.participantShifts.map((shift) => {
      const persona = personaIndex.get(shift.personaId);
      return {
        personaId: shift.personaId,
        personaName: persona?.name ?? "Unknown",
        personaDemographic: persona?.demographic ?? "",
        personaColor: persona?.color ?? "steel",
        openedQuote: shift.openedQuote,
        closedQuote: shift.closedQuote,
        shiftPercent: shift.shiftPercent,
      };
    }),
  };
}

function truncate(value: string, limit = 200): string {
  return value.length > limit ? `${value.slice(0, limit)}...` : value;
}
