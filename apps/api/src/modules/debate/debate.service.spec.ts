import { Test, TestingModule } from "@nestjs/testing";
import { DebateStatus, Emotion } from "@agora/shared";
import { DebateService } from "./debate.service";
import {
  DEBATE_REPOSITORY,
  DebateListItem,
  DebateOverview,
  IDebateRepository,
} from "./domain/i-debate.repository";
import {
  DEBATE_MESSAGE_REPOSITORY,
  IDebateMessageRepository,
} from "./domain/i-debate-message.repository";
import { DebateMessageEntity } from "./domain/debate.entity";
import { DebateNotFoundException } from "./domain/debate-not-found.exception";

describe("DebateService", () => {
  const userId = "user-1";
  const otherUserId = "user-2";

  const listRow: DebateListItem = {
    id: "debate-1",
    title: "Affordable Housing Reform Act of 2026",
    status: DebateStatus.Running,
    personaCount: 5,
    roundCount: 2,
    createdAt: new Date("2026-04-11T09:00:00.000Z"),
    personas: [
      { id: "p1", name: "Mira K.", color: "sage" },
      { id: "p2", name: "Stoyan P.", color: "rust" },
    ],
  };

  const overview: DebateOverview = {
    id: "debate-1",
    userId,
    title: "Affordable Housing Reform Act of 2026",
    status: DebateStatus.Running,
    createdAt: new Date("2026-04-11T09:00:00.000Z"),
    personas: [{ id: "p1", name: "Mira K.", demographic: "Long-term tenant", color: "sage" }],
    rounds: { completed: 2, total: 3, current: { number: 3, phase: "common-ground" } },
    turns: 12,
    keyChanges: ["4% annual rent cap in regulated zones"],
    hasSynthesis: false,
  };

  const message: DebateMessageEntity = {
    id: "msg-1",
    debateId: "debate-1",
    roundId: "round-1",
    personaId: "p1",
    content: "Tenants need predictable rents.",
    sequence: 0,
    emotion: Emotion.Calm,
    createdAt: new Date("2026-04-11T09:05:00.000Z"),
    round: { roundNumber: 1 },
    persona: {
      id: "p1",
      debateId: "debate-1",
      name: "Mira K.",
      demographic: "Long-term tenant",
      interests: "",
      fears: "",
      priorities: "",
      color: "sage",
      avatarUrl: null,
      createdAt: new Date("2026-04-11T09:00:00.000Z"),
    },
  };

  let repository: jest.Mocked<IDebateRepository>;
  let messages: jest.Mocked<IDebateMessageRepository>;
  let service: DebateService;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      findByUser: jest.fn(),
      listForUser: jest.fn(),
      getChamberStats: jest.fn(),
      findOverviewById: jest.fn(),
      save: jest.fn(),
      updateStatus: jest.fn(),
    };

    messages = {
      findByDebate: jest.fn(),
      findByRound: jest.fn(),
      append: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebateService,
        { provide: DEBATE_REPOSITORY, useValue: repository },
        { provide: DEBATE_MESSAGE_REPOSITORY, useValue: messages },
      ],
    }).compile();

    service = module.get(DebateService);
  });

  describe("listForUser", () => {
    it("maps repository rows to a paginated payload with ISO timestamps", async () => {
      repository.listForUser.mockResolvedValueOnce({ items: [listRow], total: 1 });

      const result = await service.listForUser(userId, 1, 6);

      expect(repository.listForUser).toHaveBeenCalledWith(userId, 1, 6);
      expect(result).toEqual({
        items: [
          {
            id: "debate-1",
            title: "Affordable Housing Reform Act of 2026",
            status: DebateStatus.Running,
            personaCount: 5,
            roundCount: 2,
            createdAt: "2026-04-11T09:00:00.000Z",
            personas: listRow.personas,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 6,
      });
    });

    it("returns an empty page when the user has no debates", async () => {
      repository.listForUser.mockResolvedValueOnce({ items: [], total: 0 });
      await expect(service.listForUser(userId, 1, 6)).resolves.toEqual({
        items: [],
        total: 0,
        page: 1,
        pageSize: 6,
      });
    });
  });

  describe("getChamberStats", () => {
    it("maps stats and serialises the last-active timestamp", async () => {
      repository.getChamberStats.mockResolvedValueOnce({
        totalDebates: 3,
        totalParticipants: 14,
        lastActiveAt: new Date("2026-05-01T12:00:00.000Z"),
      });

      await expect(service.getChamberStats(userId)).resolves.toEqual({
        totalDebates: 3,
        totalParticipants: 14,
        lastActiveAt: "2026-05-01T12:00:00.000Z",
      });
    });

    it("returns null when the user has no activity", async () => {
      repository.getChamberStats.mockResolvedValueOnce({
        totalDebates: 0,
        totalParticipants: 0,
        lastActiveAt: null,
      });

      await expect(service.getChamberStats(userId)).resolves.toEqual({
        totalDebates: 0,
        totalParticipants: 0,
        lastActiveAt: null,
      });
    });
  });

  describe("getOverview", () => {
    it("returns the overview DTO when the debate belongs to the caller", async () => {
      repository.findOverviewById.mockResolvedValueOnce(overview);

      const result = await service.getOverview("debate-1", userId);

      expect(result.id).toBe("debate-1");
      expect(result.createdAt).toBe("2026-04-11T09:00:00.000Z");
      expect(result.turns).toBe(12);
      expect(result.rounds.current).toEqual({ number: 3, phase: "common-ground" });
    });

    it("throws DebateNotFoundException when the row does not exist", async () => {
      repository.findOverviewById.mockResolvedValueOnce(null);

      await expect(service.getOverview("missing", userId)).rejects.toBeInstanceOf(
        DebateNotFoundException,
      );
    });

    it("throws DebateNotFoundException when the row belongs to another user", async () => {
      repository.findOverviewById.mockResolvedValueOnce(overview);

      await expect(service.getOverview("debate-1", otherUserId)).rejects.toBeInstanceOf(
        DebateNotFoundException,
      );
    });
  });

  describe("getDetail", () => {
    it("returns overview plus the eager-loaded message transcript", async () => {
      repository.findOverviewById.mockResolvedValueOnce(overview);
      messages.findByDebate.mockResolvedValueOnce([message]);

      const result = await service.getDetail("debate-1", userId);

      expect(messages.findByDebate).toHaveBeenCalledWith("debate-1");
      expect(result.turns).toBe(12);
      expect(result.messages).toEqual([
        {
          id: "msg-1",
          roundId: "round-1",
          roundNumber: 1,
          turnIndex: 0,
          emotion: Emotion.Calm,
          content: "Tenants need predictable rents.",
          createdAt: "2026-04-11T09:05:00.000Z",
          persona: { id: "p1", name: "Mira K.", demographic: "Long-term tenant", color: "sage" },
        },
      ]);
      expect(result.activeTurn).toEqual({
        roundNumber: 3,
        turnIndex: 0,
        personaId: "p1",
      });
    });

    it("throws DebateNotFoundException for another user's debate without loading messages", async () => {
      repository.findOverviewById.mockResolvedValueOnce(overview);

      await expect(service.getDetail("debate-1", otherUserId)).rejects.toBeInstanceOf(
        DebateNotFoundException,
      );
      expect(messages.findByDebate).not.toHaveBeenCalled();
    });
  });
});
