import { Test, TestingModule } from "@nestjs/testing";
import { LLM_CLIENT } from "../agent/domain/i-llm-client";
import { DEBATE_REPOSITORY } from "../debate/domain/i-debate.repository";
import { DEBATE_MESSAGE_REPOSITORY } from "../debate/domain/i-debate-message.repository";
import { JUDGE_SUMMARY_REPOSITORY } from "../debate/domain/i-judge-summary.repository";
import { PERSONA_REPOSITORY } from "../persona/domain/i-persona.repository";
import { DebateNotFoundException } from "../debate/domain/debate-not-found.exception";
import type { ILLMClient } from "../agent/domain/i-llm-client";
import type { IDebateRepository } from "../debate/domain/i-debate.repository";
import type { IDebateMessageRepository } from "../debate/domain/i-debate-message.repository";
import type { IJudgeSummaryRepository } from "../debate/domain/i-judge-summary.repository";
import type { IPersonaRepository } from "../persona/domain/i-persona.repository";
import { JudgeService } from "./judge.service";
import { JudgeNotReadyException } from "./domain/judge-not-ready.exception";
import { JudgeSynthesisException } from "./domain/judge-synthesis.exception";

const OWNER_ID = "user-1";
const DEBATE_ID = "debate-1";

const PERSONAS = [
  {
    id: "p1",
    debateId: DEBATE_ID,
    name: "Mira K.",
    role: "Tenants",
    demographic: "Long-term tenant",
    interests: [],
    fears: [],
    priorities: [],
    color: "sage",
    avatarUrl: null,
    createdAt: new Date("2026-04-11T09:00:00.000Z"),
  },
  {
    id: "p2",
    debateId: DEBATE_ID,
    name: "Stoyan P.",
    role: "Landlords",
    demographic: "Building operator",
    interests: [],
    fears: [],
    priorities: [],
    color: "rust",
    avatarUrl: null,
    createdAt: new Date("2026-04-11T09:00:00.000Z"),
  },
];

const VALID_AGENT_OUTPUT = {
  contradictions: ["c1", "c2", "c3"],
  commonGround: ["g1", "g2", "g3"],
  compromise: ["x1", "x2", "x3"],
  participantShifts: [
    { personaId: "p1", openedQuote: "opened-1", closedQuote: "closed-1", shiftPercent: 22 },
    { personaId: "p2", openedQuote: "opened-2", closedQuote: "closed-2", shiftPercent: 47 },
  ],
  closingStatement: "the chamber leaves with shape, not finality.",
};

function buildLLMClient(buffer: string): ILLMClient {
  return {
    async *streamCompletion() {
      yield buffer;
    },
  };
}

interface ServiceUnderTest {
  service: JudgeService;
  debates: jest.Mocked<IDebateRepository>;
  messages: jest.Mocked<IDebateMessageRepository>;
  personas: jest.Mocked<IPersonaRepository>;
  conclusions: jest.Mocked<IJudgeSummaryRepository>;
  llmClient: jest.Mocked<ILLMClient>;
}

async function buildService(llmClient: ILLMClient): Promise<ServiceUnderTest> {
  const debates: jest.Mocked<IDebateRepository> = {
    findById: jest.fn(),
    findByUser: jest.fn(),
    listForUser: jest.fn(),
    getChamberStats: jest.fn(),
    findOverviewById: jest.fn(),
    save: jest.fn(),
    updateStatus: jest.fn(),
    deleteWithCascade: jest.fn(),
  };
  const messages: jest.Mocked<IDebateMessageRepository> = {
    findByDebate: jest.fn(),
    findByRound: jest.fn(),
    append: jest.fn(),
  };
  const personas: jest.Mocked<IPersonaRepository> = {
    findByDebate: jest.fn(),
    saveMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    deleteByDebate: jest.fn(),
  };
  const conclusions: jest.Mocked<IJudgeSummaryRepository> = {
    findByDebate: jest.fn(),
    save: jest.fn(),
  };
  const llmSpy: jest.Mocked<ILLMClient> = {
    streamCompletion: jest.fn(llmClient.streamCompletion.bind(llmClient)),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      JudgeService,
      { provide: DEBATE_REPOSITORY, useValue: debates },
      { provide: DEBATE_MESSAGE_REPOSITORY, useValue: messages },
      { provide: PERSONA_REPOSITORY, useValue: personas },
      { provide: JUDGE_SUMMARY_REPOSITORY, useValue: conclusions },
      { provide: LLM_CLIENT, useValue: llmSpy },
    ],
  }).compile();

  return {
    service: module.get(JudgeService),
    debates,
    messages,
    personas,
    conclusions,
    llmClient: llmSpy,
  };
}

describe("JudgeService", () => {
  const debateRow = {
    id: DEBATE_ID,
    userId: OWNER_ID,
    title: "Affordable Housing Reform Act of 2026",
    billText: "Article 1...",
    sourceType: "pdf",
    status: "running",
    createdAt: new Date("2026-04-11T09:00:00.000Z"),
  };

  it("throws DebateNotFoundException when the debate does not exist", async () => {
    const { service, debates } = await buildService(buildLLMClient("{}"));
    debates.findById.mockResolvedValueOnce(null);

    await expect(service.getSynthesis(DEBATE_ID, OWNER_ID)).rejects.toBeInstanceOf(
      DebateNotFoundException,
    );
  });

  it("throws DebateNotFoundException when the debate belongs to another user", async () => {
    const { service, debates } = await buildService(buildLLMClient("{}"));
    debates.findById.mockResolvedValueOnce(debateRow);

    await expect(service.getSynthesis(DEBATE_ID, "user-2")).rejects.toBeInstanceOf(
      DebateNotFoundException,
    );
  });

  it("returns existing synthesis without invoking the LLM when one is already saved", async () => {
    const { service, debates, personas, conclusions, llmClient } = await buildService(
      buildLLMClient("{}"),
    );
    debates.findById.mockResolvedValueOnce(debateRow);
    personas.findByDebate.mockResolvedValueOnce(PERSONAS);
    conclusions.findByDebate.mockResolvedValueOnce({
      id: "jc-1",
      debateId: DEBATE_ID,
      contradictions: ["c1", "c2", "c3"],
      commonGround: ["g1", "g2", "g3"],
      compromise: ["x1", "x2", "x3"],
      participantShifts: [
        { personaId: "p1", openedQuote: "o1", closedQuote: "z1", shiftPercent: 30 },
        { personaId: "p2", openedQuote: "o2", closedQuote: "z2", shiftPercent: 60 },
      ],
      closingStatement: "previously settled.",
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
    });

    const result = await service.getSynthesis(DEBATE_ID, OWNER_ID);

    expect(llmClient.streamCompletion).not.toHaveBeenCalled();
    expect(conclusions.save).not.toHaveBeenCalled();
    expect(result.closingStatement).toBe("previously settled.");
    expect(result.participantShifts[0]).toMatchObject({
      personaId: "p1",
      personaName: "Mira K.",
      personaColor: "sage",
      shiftPercent: 30,
    });
  });

  it("throws JudgeNotReadyException when fewer than 3 rounds are complete", async () => {
    const { service, debates, personas, conclusions } = await buildService(buildLLMClient("{}"));
    debates.findById.mockResolvedValueOnce(debateRow);
    personas.findByDebate.mockResolvedValueOnce(PERSONAS);
    conclusions.findByDebate.mockResolvedValueOnce(null);
    debates.findOverviewById.mockResolvedValueOnce({
      id: DEBATE_ID,
      userId: OWNER_ID,
      title: debateRow.title,
      status: "running",
      createdAt: debateRow.createdAt,
      personas: PERSONAS.map((p) => ({
        id: p.id,
        name: p.name,
        demographic: p.demographic,
        color: p.color,
      })),
      rounds: { completed: 2, total: 3, current: { number: 3, phase: "common_ground" } },
      turns: 4,
      keyChanges: [],
      hasSynthesis: false,
    });

    await expect(service.getSynthesis(DEBATE_ID, OWNER_ID)).rejects.toBeInstanceOf(
      JudgeNotReadyException,
    );
  });

  it("synthesises lazily on first request and persists the agent output", async () => {
    const { service, debates, messages, personas, conclusions, llmClient } = await buildService(
      buildLLMClient(JSON.stringify(VALID_AGENT_OUTPUT)),
    );

    debates.findById.mockResolvedValueOnce(debateRow);
    personas.findByDebate.mockResolvedValueOnce(PERSONAS);
    conclusions.findByDebate.mockResolvedValueOnce(null);
    debates.findOverviewById.mockResolvedValueOnce({
      id: DEBATE_ID,
      userId: OWNER_ID,
      title: debateRow.title,
      status: "running",
      createdAt: debateRow.createdAt,
      personas: PERSONAS.map((p) => ({
        id: p.id,
        name: p.name,
        demographic: p.demographic,
        color: p.color,
      })),
      rounds: { completed: 3, total: 3, current: { number: 3, phase: "common_ground" } },
      turns: 6,
      keyChanges: [],
      hasSynthesis: false,
    });
    messages.findByDebate.mockResolvedValueOnce([
      {
        id: "m1",
        debateId: DEBATE_ID,
        roundId: "r1",
        personaId: "p1",
        content: "opening from p1",
        sequence: 0,
        emotion: "calm" as never,
        createdAt: new Date("2026-04-11T09:01:00.000Z"),
        round: { roundNumber: 1 },
        persona: PERSONAS[0],
      },
      {
        id: "m2",
        debateId: DEBATE_ID,
        roundId: "r1",
        personaId: "p2",
        content: "opening from p2",
        sequence: 1,
        emotion: "calm" as never,
        createdAt: new Date("2026-04-11T09:02:00.000Z"),
        round: { roundNumber: 1 },
        persona: PERSONAS[1],
      },
    ]);
    conclusions.save.mockImplementation(async (data) => ({
      id: "jc-new",
      ...data,
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
    }));

    const result = await service.getSynthesis(DEBATE_ID, OWNER_ID);

    expect(llmClient.streamCompletion).toHaveBeenCalledTimes(1);
    expect(conclusions.save).toHaveBeenCalledTimes(1);
    const saved = conclusions.save.mock.calls[0][0];
    expect(saved.contradictions).toEqual(VALID_AGENT_OUTPUT.contradictions);
    expect(saved.participantShifts.map((s) => s.personaId)).toEqual(["p1", "p2"]);

    expect(result.title).toBe(debateRow.title);
    expect(result.contradictions).toEqual(VALID_AGENT_OUTPUT.contradictions);
    expect(result.participantShifts).toHaveLength(2);
    expect(result.participantShifts[0]).toMatchObject({
      personaId: "p1",
      personaName: "Mira K.",
      personaDemographic: "Long-term tenant",
      personaColor: "sage",
      shiftPercent: 22,
    });
  });

  it("rejects malformed agent output with JudgeSynthesisException", async () => {
    const { service, debates, messages, personas, conclusions } = await buildService(
      buildLLMClient(JSON.stringify({ contradictions: ["only one"] })),
    );

    debates.findById.mockResolvedValueOnce(debateRow);
    personas.findByDebate.mockResolvedValueOnce(PERSONAS);
    conclusions.findByDebate.mockResolvedValueOnce(null);
    debates.findOverviewById.mockResolvedValueOnce({
      id: DEBATE_ID,
      userId: OWNER_ID,
      title: debateRow.title,
      status: "running",
      createdAt: debateRow.createdAt,
      personas: PERSONAS.map((p) => ({
        id: p.id,
        name: p.name,
        demographic: p.demographic,
        color: p.color,
      })),
      rounds: { completed: 3, total: 3, current: null },
      turns: 6,
      keyChanges: [],
      hasSynthesis: false,
    });
    messages.findByDebate.mockResolvedValueOnce([]);

    await expect(service.getSynthesis(DEBATE_ID, OWNER_ID)).rejects.toBeInstanceOf(
      JudgeSynthesisException,
    );
    expect(conclusions.save).not.toHaveBeenCalled();
  });
});
