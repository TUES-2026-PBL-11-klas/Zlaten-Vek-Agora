import { Inject, Injectable, Logger } from "@nestjs/common";
import { Observable, Subject } from "rxjs";
import { DebateStatus, RoundType, DebateEvent, Emotion } from "@agora/shared";
import { PersonaAgentFactory } from "../../agent/domain/persona-agent-factory";
import { PersonaAgent } from "../../agent/domain/persona-agent";
import { JudgeAgent } from "../../agent/domain/judge-agent";
import { LLMMessage } from "../../agent/domain/agent-context";
import { PERSONA_REPOSITORY, IPersonaRepository } from "../../persona/domain/i-persona.repository";
import { PersonaEntity } from "../../persona/domain/persona.entity";
import { DEBATE_REPOSITORY, IDebateRepository } from "../domain/i-debate.repository";
import {
  DEBATE_MESSAGE_REPOSITORY,
  IDebateMessageRepository,
} from "../domain/i-debate-message.repository";
import { ROUND_REPOSITORY, IRoundRepository } from "../domain/i-round.repository";
import {
  ANALYSIS_RESULT_REPOSITORY,
  IAnalysisResultRepository,
} from "../../analysis/domain/i-analysis-result.repository";
import {
  JUDGE_SUMMARY_REPOSITORY,
  IJudgeSummaryRepository,
} from "../domain/i-judge-summary.repository";
import { DebateAlreadyRunningException } from "../../../common/exceptions/debate-already-running.exception";
import { DebateNotStartableException } from "../../../common/exceptions/debate-not-startable.exception";
import { DebateNotFoundException } from "../domain/debate-not-found.exception";
import { MetricsService } from "../../metrics/metrics.service";

export const ROUND_PHASES: RoundType[] = [
  RoundType.Position,
  RoundType.Counter,
  RoundType.CommonGround,
];

export interface StartOptions {
  /** When true the session pauses after each round_end and waits for advance(). */
  stepMode?: boolean;
}

interface DebateSession {
  debateId: string;
  billText: string;
  agents: PersonaAgent[];
  judgeAgent: JudgeAgent;
  personas: PersonaEntity[];
  history: LLMMessage[];
  subject: Subject<DebateEvent>;
  stepMode: boolean;
  /** Resolve function of the current inter-round gate. null in auto-play or when not paused. */
  roundGate: (() => void) | null;
  /** Bill-wide fault lines from analysis, shared by all personas. */
  contentiousPoints: string[];
  /** Headline changes the bill introduces, from analysis. */
  keyChanges: string[];
  /** Per-persona stance keyed by persona id, derived from the analysis groups. */
  stanceByPersonaId: Map<string, { stance: string; reason: string }>;
}

@Injectable()
export class AgentOrchestrator {
  private readonly logger = new Logger(AgentOrchestrator.name);

  // ConcurrentHashMap-equivalent: Map keyed by debate id for concurrent session tracking
  private readonly sessions = new Map<string, DebateSession>();

  constructor(
    @Inject(DEBATE_REPOSITORY) private readonly debates: IDebateRepository,
    @Inject(PERSONA_REPOSITORY) private readonly personas: IPersonaRepository,
    @Inject(ROUND_REPOSITORY) private readonly rounds: IRoundRepository,
    @Inject(DEBATE_MESSAGE_REPOSITORY) private readonly messages: IDebateMessageRepository,
    @Inject(JUDGE_SUMMARY_REPOSITORY) private readonly judgeSummaries: IJudgeSummaryRepository,
    @Inject(ANALYSIS_RESULT_REPOSITORY)
    private readonly analysisResults: IAnalysisResultRepository,
    private readonly factory: PersonaAgentFactory,
    private readonly metrics: MetricsService,
  ) {}

  async start(debateId: string, options: StartOptions = {}): Promise<void> {
    const debate = await this.debates.findById(debateId);
    if (!debate) throw new DebateNotFoundException(debateId);

    if (this.sessions.has(debateId)) {
      throw new DebateAlreadyRunningException(debateId);
    }

    if (debate.status !== DebateStatus.PersonasPending) {
      throw new DebateNotStartableException(debateId, debate.status);
    }

    const personaEntities = await this.personas.findByDebate(debateId);
    if (personaEntities.length === 0) {
      throw new DebateNotStartableException(debateId, "no_personas");
    }

    const agents = personaEntities.map((p) => this.factory.create(p));
    const judgeAgent = this.factory.createJudge();

    // Load the analysis so personas debate the fault lines already identified, and each
    // speaks from its assigned stance. Match group -> persona by representative name
    // (group.personName === persona.name), falling back to the group label (group.name
    // === persona.role). Best-effort: edited personas with no match simply omit stance.
    const analysis = await this.analysisResults.findByDebate(debateId);
    const stanceByPersonaId = new Map<string, { stance: string; reason: string }>();
    if (analysis) {
      for (const persona of personaEntities) {
        const group = analysis.affectedGroups.find(
          (g) => g.personName === persona.name || g.name === persona.role,
        );
        if (group) {
          stanceByPersonaId.set(persona.id, {
            stance: group.stance,
            reason: group.stanceReason,
          });
        }
      }
    }

    const session: DebateSession = {
      debateId,
      billText: debate.billText,
      agents,
      judgeAgent,
      personas: personaEntities,
      history: [],
      subject: new Subject<DebateEvent>(),
      stepMode: options.stepMode ?? false,
      roundGate: null,
      contentiousPoints: analysis?.contentiousPoints ?? [],
      keyChanges: analysis?.keyChanges ?? [],
      stanceByPersonaId,
    };

    this.sessions.set(debateId, session);
    await this.debates.updateStatus(debateId, DebateStatus.Running);

    const endTimer = this.metrics.debateGenerationDuration.startTimer();

    // Defer to a macro-task so callers can subscribe to session.subject before
    // the first event fires (important for tests; negligible latency in production).
    setImmediate(() => {
      void this.runSession(session)
        .then(() => endTimer())
        .catch((err: unknown) => {
          endTimer();
          this.logger.error(`Session ${debateId} failed: ${String(err)}`);
          session.subject.next({ type: "error", data: { message: String(err) } });
          session.subject.complete();
          this.sessions.delete(debateId);
        });
    });
  }

  /**
   * In step mode, unblocks the next round. In auto mode, this is a no-op.
   * Throws DebateNotFoundException if no session exists for debateId.
   */
  advance(debateId: string): void {
    const session = this.sessions.get(debateId);
    if (!session) throw new DebateNotFoundException(debateId);

    if (!session.stepMode || session.roundGate === null) return;

    const resolve = session.roundGate;
    session.roundGate = null;
    resolve();
  }

  subscribe(debateId: string): Observable<DebateEvent> {
    const session = this.sessions.get(debateId);
    if (!session) {
      return new Observable((sub) => sub.complete());
    }
    return session.subject.asObservable();
  }

  isRunning(debateId: string): boolean {
    return this.sessions.has(debateId);
  }

  isPaused(debateId: string): boolean {
    const session = this.sessions.get(debateId);
    return session?.roundGate !== null && session?.roundGate !== undefined;
  }

  private async runSession(session: DebateSession): Promise<void> {
    const { debateId, billText } = session;

    for (let i = 0; i < ROUND_PHASES.length; i++) {
      const roundNumber = i + 1;
      const phase = ROUND_PHASES[i];

      const roundEntity = await this.rounds.create({ debateId, roundNumber, phase });
      session.subject.next({ type: "round_start", data: { roundNumber, phase } });

      let messageSequence = 0;

      for (const agent of session.agents) {
        const persona = session.personas.find((p) => p.id === agent.id)!;
        session.subject.next({
          type: "persona_start",
          data: { personaId: agent.id, personaName: agent.personaName },
        });

        const tokens: string[] = [];
        const context = {
          billText,
          persona: persona.name,
          history: [...session.history],
          roundNumber,
          roundType: phase,
          contentiousPoints: session.contentiousPoints,
          keyChanges: session.keyChanges,
          personaStance: session.stanceByPersonaId.get(agent.id),
        };

        for await (const token of agent.generateResponse(context)) {
          tokens.push(token);
          session.subject.next({ type: "token", data: { personaId: agent.id, token } });
        }

        const fullText = tokens.join("");
        const messageEntity = await this.messages.append({
          debateId,
          roundId: roundEntity.id,
          personaId: agent.id,
          content: fullText,
          sequence: messageSequence++,
          emotion: Emotion.Calm,
        });

        session.history.push({
          role: "assistant",
          content: `${agent.personaName}: ${fullText}`,
        });

        session.subject.next({
          type: "persona_end",
          data: {
            personaId: agent.id,
            messageId: messageEntity.id,
            emotion: Emotion.Calm,
          },
        });
      }

      await this.rounds.complete(roundEntity.id);
      session.subject.next({ type: "round_end", data: { roundNumber } });

      // In step mode, pause between rounds (not after the last round — judge runs immediately).
      const isLastRound = i === ROUND_PHASES.length - 1;
      if (session.stepMode && !isLastRound) {
        await new Promise<void>((resolve) => {
          session.roundGate = resolve;
        });
      }
    }

    // Judge synthesis
    session.subject.next({ type: "judge_start", data: {} });

    const judgeContext = {
      billText,
      history: [...session.history],
      roundNumber: ROUND_PHASES.length + 1,
      roundType: RoundType.CommonGround,
      roster: session.personas.map((p) => ({ id: p.id, name: p.name })),
    };

    const judgeTokens: string[] = [];
    for await (const token of session.judgeAgent.generateResponse(judgeContext)) {
      judgeTokens.push(token);
      session.subject.next({ type: "judge_token", data: { token } });
    }

    const judgeText = judgeTokens.join("");
    const summary = await this.saveJudgeSummary(debateId, judgeText, session.personas);

    await this.debates.updateStatus(debateId, DebateStatus.Completed);
    session.subject.next({ type: "debate_complete", data: { summaryId: summary.id } });
    session.subject.complete();
    this.sessions.delete(debateId);
  }

  private async saveJudgeSummary(debateId: string, judgeText: string, personas: PersonaEntity[]) {
    type ParsedShift = {
      personaId?: string;
      openedQuote?: string;
      closedQuote?: string;
      shiftPercent?: number;
    };
    let parsed: {
      contradictions?: string[];
      commonGround?: string[];
      compromise?: string[];
      participantShifts?: ParsedShift[];
      closingStatement?: string;
    } = {};

    try {
      parsed = JSON.parse(judgeText) as typeof parsed;
    } catch {
      this.logger.warn(`JudgeAgent for debate ${debateId} returned non-JSON, using fallback`);
      parsed = {
        contradictions: [],
        commonGround: [],
        compromise: [],
        participantShifts: [],
        closingStatement: "",
      };
    }

    const validIds = new Set(personas.map((p) => p.id));
    const order = new Map(personas.map((p, idx) => [p.id, idx]));
    const shifts = (parsed.participantShifts ?? [])
      .filter(
        (s): s is Required<ParsedShift> =>
          typeof s.personaId === "string" &&
          validIds.has(s.personaId) &&
          typeof s.openedQuote === "string" &&
          typeof s.closedQuote === "string" &&
          typeof s.shiftPercent === "number",
      )
      .map((s) => ({
        personaId: s.personaId,
        openedQuote: s.openedQuote,
        closedQuote: s.closedQuote,
        shiftPercent: Math.min(Math.max(Math.round(s.shiftPercent), 0), 100),
      }))
      .sort((a, b) => (order.get(a.personaId) ?? 0) - (order.get(b.personaId) ?? 0));

    return this.judgeSummaries.save({
      debateId,
      contradictions: parsed.contradictions ?? [],
      commonGround: parsed.commonGround ?? [],
      compromise: parsed.compromise ?? [],
      participantShifts: shifts,
      closingStatement: parsed.closingStatement ?? "",
    });
  }
}
