import { Test, TestingModule } from "@nestjs/testing";
import { DebateStatus } from "@agora/shared";
import { DebateService } from "./debate.service";
import {
  DEBATE_REPOSITORY,
  DebateListItem,
  DebateOverview,
  IDebateRepository,
} from "./domain/i-debate.repository";
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
    keyChanges: ["4% annual rent cap in regulated zones"],
    hasSynthesis: false,
  };

  let repository: jest.Mocked<IDebateRepository>;
  let service: DebateService;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      findByUser: jest.fn(),
      listForUser: jest.fn(),
      findOverviewById: jest.fn(),
      save: jest.fn(),
      updateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DebateService, { provide: DEBATE_REPOSITORY, useValue: repository }],
    }).compile();

    service = module.get(DebateService);
  });

  describe("listForUser", () => {
    it("maps repository rows to dashboard DTOs with ISO timestamps", async () => {
      repository.listForUser.mockResolvedValueOnce([listRow]);

      const result = await service.listForUser(userId);

      expect(repository.listForUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual([
        {
          id: "debate-1",
          title: "Affordable Housing Reform Act of 2026",
          status: DebateStatus.Running,
          personaCount: 5,
          roundCount: 2,
          createdAt: "2026-04-11T09:00:00.000Z",
          personas: listRow.personas,
        },
      ]);
    });

    it("returns an empty array when the user has no debates", async () => {
      repository.listForUser.mockResolvedValueOnce([]);
      await expect(service.listForUser(userId)).resolves.toEqual([]);
    });
  });

  describe("getOverview", () => {
    it("returns the overview DTO when the debate belongs to the caller", async () => {
      repository.findOverviewById.mockResolvedValueOnce(overview);

      const result = await service.getOverview("debate-1", userId);

      expect(result.id).toBe("debate-1");
      expect(result.createdAt).toBe("2026-04-11T09:00:00.000Z");
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
});
