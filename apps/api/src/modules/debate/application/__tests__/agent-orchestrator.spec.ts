import { Test, TestingModule } from "@nestjs/testing";
import { firstValueFrom, toArray } from "rxjs";
import { DebateStatus, DebateEvent } from "@agora/shared";
import { AgentOrchestrator, ROUND_PHASES } from "../agent-orchestrator";
import { PersonaAgentFactory } from "../../../agent/domain/persona-agent-factory";
import { DEBATE_REPOSITORY, IDebateRepository } from "../../domain/i-debate.repository";
import {
  PERSONA_REPOSITORY,
  IPersonaRepository,
} from "../../../persona/domain/i-persona.repository";
import { ROUND_REPOSITORY, IRoundRepository } from "../../domain/i-round.repository";
import {
  DEBATE_MESSAGE_REPOSITORY,
  IDebateMessageRepository,
} from "../../domain/i-debate-message.repository";
import {
  JUDGE_SUMMARY_REPOSITORY,
  IJudgeSummaryRepository,
} from "../../domain/i-judge-summary.repository";
import { DebateEntity } from "../../domain/debate.entity";
import { PersonaEntity } from "../../../persona/domain/persona.entity";
import { RoundEntity } from "../../domain/round.entity";
import { DebateMessageEntity } from "../../domain/debate.entity";
import { DebateAlreadyRunningException } from "../../../../common/exceptions/debate-already-running.exception";
import { DebateNotStartableException } from "../../../../common/exceptions/debate-not-startable.exception";
import { DebateNotFoundException } from "../../domain/debate-not-found.exception";
import { MetricsService } from "../../../metrics/metrics.service";

// ─── Factories ───────────────────────────────────────────────────────────────

const makeDebate = (override: Partial<DebateEntity> = {}): DebateEntity => ({
  id: "debate-1",
  userId: "user-1",
  title: "Test Bill",
  billText: "Full bill text here",
  sourceType: "text",
  status: DebateStatus.PersonasPending,
  createdAt: new Date(),
  ...override,
});

const makePersona = (id: string, debateId = "debate-1"): PersonaEntity => ({
  id,
  debateId,
  name: `Participant ${id}`,
  role: "Test group",
  demographic: "Test demographic",
  interests: ["interest"],
  fears: ["fear"],
  priorities: ["priority"],
  color: "sage",
  avatarUrl: null,
  createdAt: new Date(),
});

let roundSeq = 0;
const makeRound = (debateId: string, roundNumber: number, phase: string): RoundEntity => ({
  id: `round-${++roundSeq}`,
  debateId,
  roundNumber,
  phase,
  startedAt: new Date(),
  endedAt: null,
});

let msgSeq = 0;
const makeMessage = (personaId: string, roundId: string): DebateMessageEntity => ({
  id: `msg-${++msgSeq}`,
  debateId: "debate-1",
  roundId,
  personaId,
  content: `Reply from ${personaId}`,
  sequence: 0,
  emotion: "calm" as DebateMessageEntity["emotion"],
  createdAt: new Date(),
  persona: makePersona(personaId),
  round: { roundNumber: 1 },
});

// ─── Mock agent builder ───────────────────────────────────────────────────────

function makeMockAgent(personaId: string, personaName: string) {
  return {
    id: personaId,
    personaName,
    generateResponse: async function* () {
      yield `Hello from ${personaName}`;
    },
  };
}

function makeMockJudge() {
  return {
    id: "judge",
    personaName: "Judge",
    generateResponse: async function* () {
      yield '{"contradictions":[],"commonGround":[],"compromise":[],"participantShifts":[],"closingStatement":""}';
    },
  };
}

// ─── Test helper: collect all events from a running session ──────────────────
// IMPORTANT: call this AFTER await orchestrator.start() so the session exists
// and runSession hasn't fired yet (it uses setImmediate, so it fires after
// the next macro-task, i.e. after all current microtasks including this call).

function collectEvents(orchestrator: AgentOrchestrator, debateId: string): Promise<DebateEvent[]> {
  return firstValueFrom(orchestrator.subscribe(debateId).pipe(toArray()));
}

// ─── Shared mock repo builders ────────────────────────────────────────────────

function makeRepos(personas: PersonaEntity[], debateId = "debate-1") {
  const debate = makeDebate({ id: debateId, status: DebateStatus.PersonasPending });

  const debateRepo: jest.Mocked<IDebateRepository> = {
    findById: jest.fn().mockResolvedValue(debate),
    findByUser: jest.fn(),
    listForUser: jest.fn(),
    getChamberStats: jest.fn(),
    findOverviewById: jest.fn(),
    save: jest.fn(),
    updateStatus: jest.fn().mockResolvedValue({ ...debate, status: DebateStatus.Running }),
  } as unknown as jest.Mocked<IDebateRepository>;

  const personaRepo: jest.Mocked<IPersonaRepository> = {
    findByDebate: jest.fn().mockResolvedValue(personas),
    saveMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    deleteByDebate: jest.fn(),
  } as unknown as jest.Mocked<IPersonaRepository>;

  const roundRepo: jest.Mocked<IRoundRepository> = {
    create: jest
      .fn()
      .mockImplementation((data: { debateId: string; roundNumber: number; phase: string }) =>
        Promise.resolve(makeRound(data.debateId, data.roundNumber, data.phase)),
      ),
    complete: jest.fn().mockResolvedValue(undefined),
    findByDebate: jest.fn(),
    findActive: jest.fn(),
  } as unknown as jest.Mocked<IRoundRepository>;

  const messageRepo: jest.Mocked<IDebateMessageRepository> = {
    findByDebate: jest.fn(),
    findByRound: jest.fn(),
    append: jest
      .fn()
      .mockImplementation((data: { personaId: string; roundId: string }) =>
        Promise.resolve(makeMessage(data.personaId, data.roundId)),
      ),
  } as unknown as jest.Mocked<IDebateMessageRepository>;

  const judgeSummaryRepo: jest.Mocked<IJudgeSummaryRepository> = {
    save: jest.fn().mockResolvedValue({
      id: "summary-1",
      debateId,
      contradictions: [],
      commonGround: [],
      compromise: [],
      participantShifts: [],
      closingStatement: "",
      createdAt: new Date(),
    }),
    findByDebate: jest.fn(),
  } as unknown as jest.Mocked<IJudgeSummaryRepository>;

  return { debateRepo, personaRepo, roundRepo, messageRepo, judgeSummaryRepo };
}

// ─── Suite setup helper ───────────────────────────────────────────────────────

async function buildOrchestrator(
  personas: PersonaEntity[],
  debateId = "debate-1",
): Promise<{ orchestrator: AgentOrchestrator; repos: ReturnType<typeof makeRepos> }> {
  const repos = makeRepos(personas, debateId);

  const factory = {
    create: jest.fn().mockImplementation((p: PersonaEntity) => makeMockAgent(p.id, p.name)),
    createJudge: jest.fn().mockReturnValue(makeMockJudge()),
  } as unknown as jest.Mocked<PersonaAgentFactory>;

  const mockMetrics = {
    debateGenerationDuration: { startTimer: jest.fn().mockReturnValue(jest.fn()) },
  } as unknown as MetricsService;

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AgentOrchestrator,
      { provide: DEBATE_REPOSITORY, useValue: repos.debateRepo },
      { provide: PERSONA_REPOSITORY, useValue: repos.personaRepo },
      { provide: ROUND_REPOSITORY, useValue: repos.roundRepo },
      { provide: DEBATE_MESSAGE_REPOSITORY, useValue: repos.messageRepo },
      { provide: JUDGE_SUMMARY_REPOSITORY, useValue: repos.judgeSummaryRepo },
      { provide: PersonaAgentFactory, useValue: factory },
      { provide: MetricsService, useValue: mockMetrics },
    ],
  }).compile();

  return { orchestrator: module.get(AgentOrchestrator), repos };
}

// ─── Guard tests ──────────────────────────────────────────────────────────────

describe("AgentOrchestrator - guards", () => {
  it("throws DebateNotFoundException when debate not found", async () => {
    const { orchestrator, repos } = await buildOrchestrator([makePersona("p1")]);
    repos.debateRepo.findById.mockResolvedValue(null);
    await expect(orchestrator.start("missing-id")).rejects.toBeInstanceOf(DebateNotFoundException);
  });

  it("throws DebateAlreadyRunningException when session already active", async () => {
    const personas = [makePersona("p1")];
    const { orchestrator } = await buildOrchestrator(personas);
    await orchestrator.start("debate-1");
    await expect(orchestrator.start("debate-1")).rejects.toBeInstanceOf(
      DebateAlreadyRunningException,
    );
  });

  it("throws DebateNotStartableException when status is not personas_pending", async () => {
    const { orchestrator, repos } = await buildOrchestrator([makePersona("p1")]);
    repos.debateRepo.findById.mockResolvedValue(makeDebate({ status: DebateStatus.Draft }));
    await expect(orchestrator.start("debate-1")).rejects.toBeInstanceOf(
      DebateNotStartableException,
    );
  });

  it("throws DebateNotStartableException when debate has no personas", async () => {
    const { orchestrator, repos } = await buildOrchestrator([]);
    repos.personaRepo.findByDebate.mockResolvedValue([]);
    await expect(orchestrator.start("debate-1")).rejects.toBeInstanceOf(
      DebateNotStartableException,
    );
  });
});

// ─── subscribe() ─────────────────────────────────────────────────────────────

describe("AgentOrchestrator - subscribe()", () => {
  it("completes immediately for unknown debateId", (done) => {
    buildOrchestrator([]).then(({ orchestrator }) => {
      orchestrator.subscribe("non-existent").subscribe({
        complete: () => done(),
        error: done,
      });
    }, done);
  });

  it("isRunning returns false for unknown debateId", async () => {
    const { orchestrator } = await buildOrchestrator([]);
    expect(orchestrator.isRunning("non-existent")).toBe(false);
  });

  it("isRunning returns true after start and false after completion", async () => {
    const { orchestrator } = await buildOrchestrator([makePersona("p1")]);
    await orchestrator.start("debate-1");
    // subscribe after start: session exists, runSession deferred to setImmediate
    const done = collectEvents(orchestrator, "debate-1");
    expect(orchestrator.isRunning("debate-1")).toBe(true);
    await done;
    expect(orchestrator.isRunning("debate-1")).toBe(false);
  });
});

// ─── Round ordering: 2 agents ────────────────────────────────────────────────

describe("AgentOrchestrator - round ordering with 2 agents", () => {
  it("emits 3 rounds, each with both agents speaking, then debate_complete", async () => {
    const personas = [makePersona("p1"), makePersona("p2")];
    const { orchestrator } = await buildOrchestrator(personas);
    await orchestrator.start("debate-1");
    const events = await collectEvents(orchestrator, "debate-1");

    const types = events.map((e) => e.type);
    expect(types[types.length - 1]).toBe("debate_complete");

    const roundStarts = events.filter((e) => e.type === "round_start");
    expect(roundStarts).toHaveLength(ROUND_PHASES.length);

    const personaEnds = events.filter((e) => e.type === "persona_end");
    expect(personaEnds).toHaveLength(ROUND_PHASES.length * personas.length); // 3 rounds × 2 agents = 6
  });

  it("emits round_start before any persona_start within each round", async () => {
    const personas = [makePersona("p1"), makePersona("p2")];
    const { orchestrator } = await buildOrchestrator(personas);
    await orchestrator.start("debate-1");
    const events = await collectEvents(orchestrator, "debate-1");

    // Walk events linearly: every persona_start must follow the most recent round_start
    let lastRoundStartIdx = -1;
    for (let i = 0; i < events.length; i++) {
      if (events[i].type === "round_start") lastRoundStartIdx = i;
      if (events[i].type === "persona_start") {
        expect(lastRoundStartIdx).toBeGreaterThanOrEqual(0);
        expect(lastRoundStartIdx).toBeLessThan(i);
      }
    }
    // Sanity: all rounds emitted their round_start
    expect(lastRoundStartIdx).toBeGreaterThan(-1);
  });

  it("agents speak in registration order within every round", async () => {
    const personas = [makePersona("p1"), makePersona("p2")];
    const { orchestrator } = await buildOrchestrator(personas);
    await orchestrator.start("debate-1");
    const events = await collectEvents(orchestrator, "debate-1");

    const personaStarts = events
      .filter(
        (e): e is Extract<DebateEvent, { type: "persona_start" }> => e.type === "persona_start",
      )
      .map((e) => e.data.personaId);

    // Each round: p1 then p2
    const expected = Array.from({ length: ROUND_PHASES.length }, () => ["p1", "p2"]).flat();
    expect(personaStarts).toEqual(expected);
  });
});

// ─── Round ordering: 5 agents ────────────────────────────────────────────────

describe("AgentOrchestrator - round ordering with 5 agents", () => {
  it("processes all 5 agents per round across 3 rounds (15 persona_end events)", async () => {
    const personas = [1, 2, 3, 4, 5].map((n) => makePersona(`p${n}`));
    const { orchestrator } = await buildOrchestrator(personas);
    await orchestrator.start("debate-1");
    const events = await collectEvents(orchestrator, "debate-1");

    const personaEnds = events.filter((e) => e.type === "persona_end");
    expect(personaEnds).toHaveLength(ROUND_PHASES.length * 5); // 3 × 5 = 15
  });

  it("round phases follow position → counter → common_ground order", async () => {
    const personas = [makePersona("p1"), makePersona("p2")];
    const { orchestrator } = await buildOrchestrator(personas);
    await orchestrator.start("debate-1");
    const events = await collectEvents(orchestrator, "debate-1");

    const phases = events
      .filter((e): e is Extract<DebateEvent, { type: "round_start" }> => e.type === "round_start")
      .map((e) => e.data.phase);

    expect(phases).toEqual(ROUND_PHASES);
  });
});

// ─── Round ordering: 10 agents ───────────────────────────────────────────────

describe("AgentOrchestrator - round ordering with 10 agents", () => {
  it("processes all 10 agents per round across 3 rounds (30 persona_end events)", async () => {
    const personas = Array.from({ length: 10 }, (_, i) => makePersona(`p${i + 1}`));
    const { orchestrator } = await buildOrchestrator(personas);
    await orchestrator.start("debate-1");
    const events = await collectEvents(orchestrator, "debate-1");

    const personaEnds = events.filter((e) => e.type === "persona_end");
    expect(personaEnds).toHaveLength(ROUND_PHASES.length * 10); // 3 × 10 = 30
  });

  it("agents speak in registration order within every round for 10 agents", async () => {
    const personas = Array.from({ length: 10 }, (_, i) => makePersona(`p${i + 1}`));
    const { orchestrator } = await buildOrchestrator(personas);
    await orchestrator.start("debate-1");
    const events = await collectEvents(orchestrator, "debate-1");

    const personaStarts = events
      .filter(
        (e): e is Extract<DebateEvent, { type: "persona_start" }> => e.type === "persona_start",
      )
      .map((e) => e.data.personaId);

    const expectedOrder = personas.map((p) => p.id);
    const expected = Array.from({ length: ROUND_PHASES.length }, () => expectedOrder).flat();
    expect(personaStarts).toEqual(expected);
  });
});

// ─── Concurrent session isolation ────────────────────────────────────────────

describe("AgentOrchestrator - concurrent session isolation", () => {
  it("two simultaneous sessions share no events", async () => {
    const personasA = [makePersona("a1", "debate-A")];
    const personasB = [makePersona("b1", "debate-B")];

    const reposA = makeRepos(personasA, "debate-A");
    reposA.debateRepo.findById.mockResolvedValue(makeDebate({ id: "debate-A" }));
    reposA.personaRepo.findByDebate.mockResolvedValue(personasA);

    const reposB = makeRepos(personasB, "debate-B");
    reposB.debateRepo.findById.mockResolvedValue(makeDebate({ id: "debate-B" }));
    reposB.personaRepo.findByDebate.mockResolvedValue(personasB);

    const factory = {
      create: jest.fn().mockImplementation((p: PersonaEntity) => makeMockAgent(p.id, p.name)),
      createJudge: jest.fn().mockReturnValue(makeMockJudge()),
    } as unknown as jest.Mocked<PersonaAgentFactory>;

    const concurrencyMetrics = {
      debateGenerationDuration: { startTimer: jest.fn().mockReturnValue(jest.fn()) },
    } as unknown as MetricsService;

    const module = await Test.createTestingModule({
      providers: [
        AgentOrchestrator,
        { provide: DEBATE_REPOSITORY, useValue: reposA.debateRepo },
        { provide: PERSONA_REPOSITORY, useValue: reposA.personaRepo },
        { provide: ROUND_REPOSITORY, useValue: reposA.roundRepo },
        { provide: DEBATE_MESSAGE_REPOSITORY, useValue: reposA.messageRepo },
        { provide: JUDGE_SUMMARY_REPOSITORY, useValue: reposA.judgeSummaryRepo },
        { provide: PersonaAgentFactory, useValue: factory },
        { provide: MetricsService, useValue: concurrencyMetrics },
      ],
    }).compile();

    const orchestrator = module.get(AgentOrchestrator);

    // Teach the shared mocks to return the right data per debate id
    reposA.debateRepo.findById.mockImplementation((id: string) =>
      Promise.resolve(
        id === "debate-A" ? makeDebate({ id: "debate-A" }) : makeDebate({ id: "debate-B" }),
      ),
    );
    reposA.personaRepo.findByDebate.mockImplementation((id: string) =>
      Promise.resolve(id === "debate-A" ? personasA : personasB),
    );

    // Start both sessions first, then subscribe (runSession deferred to setImmediate)
    await orchestrator.start("debate-A");
    await orchestrator.start("debate-B");

    const eventsA: DebateEvent[] = [];
    const eventsB: DebateEvent[] = [];
    const doneA = new Promise<void>((res) =>
      orchestrator.subscribe("debate-A").subscribe({ next: (e) => eventsA.push(e), complete: res }),
    );
    const doneB = new Promise<void>((res) =>
      orchestrator.subscribe("debate-B").subscribe({ next: (e) => eventsB.push(e), complete: res }),
    );

    await Promise.all([doneA, doneB]);

    // Verify sessions are independent: no A ids in B's events and vice versa
    const aPersonaIds = new Set(
      eventsA
        .filter(
          (e): e is Extract<DebateEvent, { type: "persona_start" }> => e.type === "persona_start",
        )
        .map((e) => e.data.personaId),
    );
    const bPersonaIds = new Set(
      eventsB
        .filter(
          (e): e is Extract<DebateEvent, { type: "persona_start" }> => e.type === "persona_start",
        )
        .map((e) => e.data.personaId),
    );

    // a1 should only appear in session A
    expect(aPersonaIds.has("a1")).toBe(true);
    expect(bPersonaIds.has("a1")).toBe(false);
    // b1 should only appear in session B
    expect(bPersonaIds.has("b1")).toBe(true);
    expect(aPersonaIds.has("b1")).toBe(false);

    // Both sessions complete independently
    expect(eventsA.at(-1)?.type).toBe("debate_complete");
    expect(eventsB.at(-1)?.type).toBe("debate_complete");
  });
});

// ─── Step mode ───────────────────────────────────────────────────────────────

describe("AgentOrchestrator - step mode", () => {
  it("pauses after round 1 until advance() is called", async () => {
    const personas = [makePersona("p1")];
    const { orchestrator } = await buildOrchestrator(personas);

    await orchestrator.start("debate-1", { stepMode: true });

    // Subscribe after start: session exists, runSession fires after current microtasks clear
    const events: DebateEvent[] = [];
    const completion = new Promise<void>((res) =>
      orchestrator.subscribe("debate-1").subscribe({ next: (e) => events.push(e), complete: res }),
    );

    // Wait for round 1 to complete (round_end event appears)
    await new Promise<void>((resolve) => {
      const check = () => {
        if (events.some((e) => e.type === "round_end")) resolve();
        else setTimeout(check, 5);
      };
      check();
    });

    // Session should be paused — round 2 hasn't started
    expect(orchestrator.isPaused("debate-1")).toBe(true);
    const countBeforeAdvance = events.filter((e) => e.type === "round_start").length;
    expect(countBeforeAdvance).toBe(1);

    // Advance through remaining rounds
    orchestrator.advance("debate-1");
    await new Promise<void>((resolve) => {
      const check = () => {
        const roundEnds = events.filter((e) => e.type === "round_end").length;
        if (roundEnds >= 2) resolve();
        else setTimeout(check, 5);
      };
      check();
    });

    orchestrator.advance("debate-1");
    await completion;

    expect(events.at(-1)?.type).toBe("debate_complete");
    expect(events.filter((e) => e.type === "round_end")).toHaveLength(ROUND_PHASES.length);
  });

  it("advance() is a no-op when not in step mode", async () => {
    const { orchestrator } = await buildOrchestrator([makePersona("p1")]);
    await orchestrator.start("debate-1"); // auto mode
    const done = collectEvents(orchestrator, "debate-1");
    expect(() => orchestrator.advance("debate-1")).not.toThrow();
    await done; // session completes
  });

  it("advance() throws DebateNotFoundException for unknown debate", async () => {
    const { orchestrator } = await buildOrchestrator([]);
    expect(() => orchestrator.advance("non-existent")).toThrow(DebateNotFoundException);
  });
});

// ─── Step mode vs auto mode equivalence ──────────────────────────────────────

describe("AgentOrchestrator - step mode vs auto mode produce equivalent event sequences", () => {
  it("event type sequences are identical regardless of mode", async () => {
    const personas = [makePersona("p1"), makePersona("p2")];

    // Auto mode — subscribe after start
    const { orchestrator: autoOrch } = await buildOrchestrator(personas, "auto-debate");
    await autoOrch.start("auto-debate");
    const autoEvents = await collectEvents(autoOrch, "auto-debate");

    // Step mode — subscribe after start, then drive all advances
    const { orchestrator: stepOrch } = await buildOrchestrator(personas, "step-debate");
    await stepOrch.start("step-debate", { stepMode: true });

    const stepEvents: DebateEvent[] = [];
    const stepCompletion = new Promise<void>((res) =>
      stepOrch.subscribe("step-debate").subscribe({
        next: (e) => stepEvents.push(e),
        complete: res,
      }),
    );

    // Drive all advances
    for (let i = 0; i < ROUND_PHASES.length - 1; i++) {
      await new Promise<void>((resolve) => {
        const check = () => {
          if (stepOrch.isPaused("step-debate")) resolve();
          else setTimeout(check, 5);
        };
        check();
      });
      stepOrch.advance("step-debate");
    }

    await stepCompletion;

    // Event type sequences must match
    const autoTypes = autoEvents.map((e) => e.type);
    const stepTypes = stepEvents.map((e) => e.type);
    expect(stepTypes).toEqual(autoTypes);
  });
});
