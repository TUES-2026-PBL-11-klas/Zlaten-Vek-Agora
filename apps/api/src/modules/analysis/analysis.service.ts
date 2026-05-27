import { Inject, Injectable, Logger } from "@nestjs/common";
import { DebateStatus } from "@agora/shared";
import { AppException } from "../../common/exceptions/app.exception";
import { AnalysisFailedException } from "../../common/exceptions/analysis-failed.exception";
import { AgentContext } from "../agent/domain/agent-context";
import { ILLMClient, LLM_CLIENT } from "../agent/domain/i-llm-client";
import { DEBATE_REPOSITORY, IDebateRepository } from "../debate/domain/i-debate.repository";
import { DebateNotFoundException } from "../debate/domain/debate-not-found.exception";
import { IPersonaRepository, PERSONA_REPOSITORY } from "../persona/domain/i-persona.repository";
import { PersonaEntity } from "../persona/domain/persona.entity";
import { AnalysisAgent } from "./domain/analysis-agent";
import { AffectedGroup, AnalysisResultEntity, GroupStance } from "./domain/analysis-result.entity";
import {
  ANALYSIS_RESULT_REPOSITORY,
  IAnalysisResultRepository,
} from "./domain/i-analysis-result.repository";
import { assignColor } from "./domain/persona-colors";

const VALID_STANCES: GroupStance[] = ["Supportive", "Opposed", "Mixed"];
const RETRYABLE_STATUSES = new Set<string>([DebateStatus.Draft, DebateStatus.AnalysisFailed]);

interface ParsedAnalysis {
  groups: AffectedGroup[];
  keyChanges: string[];
  contentiousPoints: string[];
}

export interface AnalyzeResult {
  analysis: AnalysisResultEntity;
  personas: PersonaEntity[];
}

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);
  private readonly agent: AnalysisAgent;

  constructor(
    @Inject(DEBATE_REPOSITORY) private readonly debates: IDebateRepository,
    @Inject(PERSONA_REPOSITORY) private readonly personas: IPersonaRepository,
    @Inject(ANALYSIS_RESULT_REPOSITORY)
    private readonly analysisResults: IAnalysisResultRepository,
    @Inject(LLM_CLIENT) llmClient: ILLMClient,
  ) {
    this.agent = new AnalysisAgent(llmClient);
  }

  async analyze(debateId: string): Promise<AnalyzeResult> {
    const debate = await this.debates.findById(debateId);
    if (!debate) throw new DebateNotFoundException(debateId);

    if (!RETRYABLE_STATUSES.has(debate.status)) {
      throw new AppException(
        `Debate ${debateId} cannot be analyzed (current: ${debate.status})`,
        400,
        "INVALID_DEBATE_STATUS",
      );
    }

    await this.clearStaleArtifacts(debateId);
    await this.debates.updateStatus(debateId, DebateStatus.Analyzing);

    let parsed: ParsedAnalysis;
    try {
      parsed = await this.runAgentWithRetry(debate.billText);
    } catch (err) {
      await this.debates.updateStatus(debateId, DebateStatus.AnalysisFailed);
      throw err;
    }

    try {
      const analysis = await this.analysisResults.save({
        debateId,
        affectedGroups: parsed.groups,
        keyChanges: parsed.keyChanges,
        contentiousPoints: parsed.contentiousPoints,
      });

      const personaInputs = parsed.groups.map((group, index) => ({
        debateId,
        name: group.name,
        demographic: group.demographics,
        interests: group.interests,
        fears: group.fears,
        priorities: group.priorities,
        color: assignColor(index),
        avatarUrl: null,
      }));
      const personas = await this.personas.saveMany(personaInputs);

      await this.debates.updateStatus(debateId, DebateStatus.PersonasPending);
      return { analysis, personas };
    } catch (err) {
      await this.clearStaleArtifacts(debateId).catch(() => undefined);
      await this.debates.updateStatus(debateId, DebateStatus.AnalysisFailed);
      throw err;
    }
  }

  private async clearStaleArtifacts(debateId: string): Promise<void> {
    await this.personas.deleteByDebate(debateId);
    await this.analysisResults.deleteByDebate(debateId);
  }

  private async runAgentWithRetry(billText: string): Promise<ParsedAnalysis> {
    const context: AgentContext = { billText, history: [], roundNumber: 0 };

    let lastParseError: AnalysisFailedException | undefined;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const raw = await this.collectStream(this.agent.generateResponse(context));
        return this.parseAndValidate(raw);
      } catch (err) {
        if (err instanceof AnalysisFailedException) {
          lastParseError = err;
          this.logger.debug(`Analysis attempt ${attempt} produced invalid JSON: ${err.message}`);
          continue;
        }
        throw err;
      }
    }

    throw lastParseError ?? new AnalysisFailedException("unknown analysis failure");
  }

  private async collectStream(stream: AsyncIterable<string>): Promise<string> {
    let result = "";
    for await (const token of stream) {
      result += token;
    }
    return result;
  }

  private parseAndValidate(raw: string): ParsedAnalysis {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new AnalysisFailedException("response was not valid JSON");
    }

    if (typeof parsed !== "object" || parsed === null) {
      throw new AnalysisFailedException("response is not a JSON object");
    }

    const obj = parsed as Record<string, unknown>;
    const groupsRaw = obj.groups;
    const keyChangesRaw = obj.keyChanges;
    const contentiousRaw = obj.contentiousPoints;

    if (!Array.isArray(groupsRaw) || groupsRaw.length === 0) {
      throw new AnalysisFailedException("groups array missing or empty");
    }
    if (!Array.isArray(keyChangesRaw)) {
      throw new AnalysisFailedException("keyChanges array missing");
    }
    if (!Array.isArray(contentiousRaw)) {
      throw new AnalysisFailedException("contentiousPoints array missing");
    }

    return {
      groups: groupsRaw.map((g, i) => validateGroup(g, i)),
      keyChanges: keyChangesRaw.filter((s): s is string => typeof s === "string"),
      contentiousPoints: contentiousRaw.filter((s): s is string => typeof s === "string"),
    };
  }
}

function validateGroup(value: unknown, index: number): AffectedGroup {
  if (typeof value !== "object" || value === null) {
    throw new AnalysisFailedException(`group[${index}] is not an object`);
  }
  const g = value as Record<string, unknown>;
  const stance = typeof g.stance === "string" ? g.stance : "";
  const safeStance: GroupStance = VALID_STANCES.includes(stance as GroupStance)
    ? (stance as GroupStance)
    : "Mixed";

  return {
    id: stringOr(g.id, `group_${index + 1}`),
    name: stringOr(g.name, `Group ${index + 1}`),
    estimatedPopulation: stringOr(g.estimatedPopulation, ""),
    demographics: stringOr(g.demographics, ""),
    interests: toStringArray(g.interests),
    fears: toStringArray(g.fears),
    priorities: toStringArray(g.priorities),
    stance: safeStance,
    stanceReason: stringOr(g.stanceReason, ""),
  };
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((s): s is string => typeof s === "string");
}
