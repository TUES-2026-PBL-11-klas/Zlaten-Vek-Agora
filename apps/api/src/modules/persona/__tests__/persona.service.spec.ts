import { DebateStatus } from "@agora/shared";
import { AppException } from "../../../common/exceptions/app.exception";
import { DebateEntity } from "../../debate/domain/debate.entity";
import { DebateNotFoundException } from "../../debate/domain/debate-not-found.exception";
import { IDebateRepository } from "../../debate/domain/i-debate.repository";
import { IPersonaRepository } from "../domain/i-persona.repository";
import { PersonaEntity } from "../domain/persona.entity";
import { PersonaService } from "../persona.service";

class FakeDebateRepo implements IDebateRepository {
  constructor(public debate: DebateEntity) {}
  async findById(id: string): Promise<DebateEntity | null> {
    return id === this.debate.id ? this.debate : null;
  }
  findByUser(): never {
    throw new Error("not used");
  }
  listForUser(): never {
    throw new Error("not used");
  }
  getChamberStats(): never {
    throw new Error("not used");
  }
  findOverviewById(): never {
    throw new Error("not used");
  }
  save(): never {
    throw new Error("not used");
  }
  updateStatus(): never {
    throw new Error("not used");
  }
  deleteWithCascade(): never {
    throw new Error("not used");
  }
}

class FakePersonaRepo implements IPersonaRepository {
  rows: PersonaEntity[] = [];
  saveCalls: Omit<PersonaEntity, "id" | "createdAt">[][] = [];
  updateCalls: (Pick<PersonaEntity, "id"> & Partial<PersonaEntity>)[][] = [];
  deletedIds: string[] = [];

  async findByDebate(debateId: string): Promise<PersonaEntity[]> {
    return this.rows.filter((r) => r.debateId === debateId);
  }
  async saveMany(personas: Omit<PersonaEntity, "id" | "createdAt">[]): Promise<PersonaEntity[]> {
    this.saveCalls.push(personas);
    const created = personas.map((p, i) => ({
      ...p,
      id: `new-${this.rows.length + i + 1}`,
      createdAt: new Date(),
    }));
    this.rows.push(...created);
    return created;
  }
  async updateMany(
    updates: (Pick<PersonaEntity, "id"> & Partial<PersonaEntity>)[],
  ): Promise<PersonaEntity[]> {
    this.updateCalls.push(updates);
    for (const update of updates) {
      const idx = this.rows.findIndex((r) => r.id === update.id);
      if (idx >= 0) this.rows[idx] = { ...this.rows[idx], ...update };
    }
    return updates.map((u) => this.rows.find((r) => r.id === u.id)!);
  }
  async deleteMany(ids: string[]): Promise<void> {
    this.deletedIds.push(...ids);
    this.rows = this.rows.filter((r) => !ids.includes(r.id));
  }
  async deleteByDebate(debateId: string): Promise<void> {
    this.rows = this.rows.filter((r) => r.debateId !== debateId);
  }
}

function buildDebate(overrides: Partial<DebateEntity> = {}): DebateEntity {
  return {
    id: "debate-1",
    userId: "user-1",
    title: "Bill",
    billText: "...",
    sourceType: "text",
    status: DebateStatus.PersonasPending,
    createdAt: new Date(),
    ...overrides,
  };
}

function buildPersona(id: string, debateId = "debate-1"): PersonaEntity {
  return {
    id,
    debateId,
    name: "Test",
    role: "Тестова група",
    demographic: "demo",
    interests: ["i"],
    fears: ["f"],
    priorities: ["p"],
    color: "sage",
    avatarUrl: null,
    createdAt: new Date(),
  };
}

describe("PersonaService.updatePersonas", () => {
  it("applies remove, update, add in order and returns full list", async () => {
    const personas = new FakePersonaRepo();
    personas.rows = [buildPersona("p1"), buildPersona("p2"), buildPersona("p3")];
    const debates = new FakeDebateRepo(buildDebate());
    const service = new PersonaService(personas, debates);

    const result = await service.updatePersonas("debate-1", "user-1", {
      remove: ["p1"],
      update: [{ id: "p2", name: "Updated Name" }],
      add: [
        {
          name: "New",
          role: "Нова група",
          demographic: "demo",
          interests: ["x"],
          fears: ["y"],
          priorities: ["z"],
        },
      ],
    });

    expect(personas.deletedIds).toEqual(["p1"]);
    expect(personas.updateCalls[0][0]).toMatchObject({ id: "p2", name: "Updated Name" });
    expect(personas.saveCalls[0][0].name).toBe("New");
    expect(personas.saveCalls[0][0].color).toBe("cobalt");
    expect(result.find((r) => r.id === "p1")).toBeUndefined();
    expect(result.find((r) => r.id === "p2")?.name).toBe("Updated Name");
  });

  it("rejects edits when debate is not in PersonasPending status", async () => {
    const personas = new FakePersonaRepo();
    const debates = new FakeDebateRepo(buildDebate({ status: DebateStatus.Running }));
    const service = new PersonaService(personas, debates);

    await expect(
      service.updatePersonas("debate-1", "user-1", { remove: ["p1"] }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("rejects when caller does not own the debate", async () => {
    const personas = new FakePersonaRepo();
    const debates = new FakeDebateRepo(buildDebate({ userId: "owner-1" }));
    const service = new PersonaService(personas, debates);

    await expect(
      service.updatePersonas("debate-1", "intruder", { remove: ["p1"] }),
    ).rejects.toBeInstanceOf(DebateNotFoundException);
  });

  it("assigns colors continuing the existing palette index", async () => {
    const personas = new FakePersonaRepo();
    personas.rows = [buildPersona("p1"), buildPersona("p2")];
    const debates = new FakeDebateRepo(buildDebate());
    const service = new PersonaService(personas, debates);

    await service.updatePersonas("debate-1", "user-1", {
      add: [
        {
          name: "Third",
          role: "Трета група",
          demographic: "demo",
          interests: [],
          fears: [],
          priorities: [],
        },
      ],
    });

    expect(personas.saveCalls[0][0].color).toBe("cobalt");
  });
});
