import { DebateStatus } from "@agora/shared";
import { DebateController } from "./debate.controller";
import { DebateService } from "./debate.service";
import { IBillTextExtractor } from "./domain/bill-text-extractor";
import { DebateNotFoundException } from "./domain/debate-not-found.exception";
import {
  ChamberStats,
  DebateListPage,
  DebateOverview,
  IDebateRepository,
} from "./domain/i-debate.repository";
import { IDebateMessageRepository } from "./domain/i-debate-message.repository";
import { DebateEntity, DebateMessageEntity } from "./domain/debate.entity";
import { AuthenticatedUser } from "../auth/auth.types";

interface SeedDebate {
  id: string;
  userId: string;
  title: string;
}

/**
 * In-memory repository that scopes every read by userId, mirroring the Prisma
 * implementation. Lets the test exercise controller -> service -> repository
 * without a database while proving cross-user reads never leak.
 */
class FakeDebateRepository implements IDebateRepository {
  constructor(private readonly seed: SeedDebate[]) {}

  async listForUser(userId: string, page: number, pageSize: number): Promise<DebateListPage> {
    const owned = this.seed.filter((d) => d.userId === userId);
    const start = (page - 1) * pageSize;
    return {
      items: owned.slice(start, start + pageSize).map((d) => ({
        id: d.id,
        title: d.title,
        status: DebateStatus.Running,
        personaCount: 3,
        roundCount: 1,
        createdAt: new Date("2026-04-11T09:00:00.000Z"),
        personas: [],
      })),
      total: owned.length,
    };
  }

  async getChamberStats(userId: string): Promise<ChamberStats> {
    const owned = this.seed.filter((d) => d.userId === userId);
    return {
      totalDebates: owned.length,
      totalParticipants: owned.length * 3,
      lastActiveAt: owned.length > 0 ? new Date("2026-04-11T09:00:00.000Z") : null,
    };
  }

  async findOverviewById(id: string): Promise<DebateOverview | null> {
    const found = this.seed.find((d) => d.id === id);
    if (!found) return null;
    return {
      id: found.id,
      userId: found.userId,
      title: found.title,
      status: DebateStatus.Running,
      createdAt: new Date("2026-04-11T09:00:00.000Z"),
      personas: [],
      rounds: { completed: 0, total: 3, current: null },
      turns: 0,
      keyChanges: [],
      hasSynthesis: false,
    };
  }

  findById(): Promise<DebateEntity | null> {
    throw new Error("not used");
  }
  findByUser(): Promise<DebateEntity[]> {
    throw new Error("not used");
  }
  save(): Promise<DebateEntity> {
    throw new Error("not used");
  }
  updateStatus(): Promise<DebateEntity> {
    throw new Error("not used");
  }
}

class FakeExtractor implements IBillTextExtractor {
  async extractFromPdf(): Promise<string> {
    throw new Error("not used");
  }
  cleanText(raw: string): string {
    return raw;
  }
}

class FakeMessageRepository implements IDebateMessageRepository {
  async findByDebate(): Promise<DebateMessageEntity[]> {
    return [];
  }
  findByRound(): Promise<DebateMessageEntity[]> {
    throw new Error("not used");
  }
  append(): Promise<DebateMessageEntity> {
    throw new Error("not used");
  }
}

describe("DebateController (integration)", () => {
  const userA: AuthenticatedUser = { userId: "user-a", email: "a@example.com" };
  const userB: AuthenticatedUser = { userId: "user-b", email: "b@example.com" };

  const seed: SeedDebate[] = [
    { id: "a-1", userId: userA.userId, title: "User A bill one" },
    { id: "a-2", userId: userA.userId, title: "User A bill two" },
    { id: "b-1", userId: userB.userId, title: "User B private bill" },
  ];

  let controller: DebateController;

  beforeEach(() => {
    const service = new DebateService(
      new FakeDebateRepository(seed),
      new FakeMessageRepository(),
      new FakeExtractor(),
    );
    controller = new DebateController(service);
  });

  it("scopes the list to the caller and never leaks another user's debates", async () => {
    const result = await controller.list(userA);

    expect(result.total).toBe(2);
    expect(result.items.map((d) => d.id)).toEqual(["a-1", "a-2"]);
    expect(result.items.some((d) => d.id === "b-1")).toBe(false);
  });

  it("paginates the scoped list", async () => {
    const result = await controller.list(userA, "1", "1");

    expect(result.pageSize).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(2);
  });

  it("returns chamber stats scoped to the caller", async () => {
    await expect(controller.chamber(userA)).resolves.toEqual({
      totalDebates: 2,
      totalParticipants: 6,
      lastActiveAt: "2026-04-11T09:00:00.000Z",
    });
  });

  it("hides another user's debate detail behind a not-found error", async () => {
    await expect(controller.detail("b-1", userA)).rejects.toBeInstanceOf(DebateNotFoundException);
  });

  it("serves the caller's own debate detail", async () => {
    const result = await controller.detail("a-1", userA);
    expect(result.id).toBe("a-1");
  });
});
