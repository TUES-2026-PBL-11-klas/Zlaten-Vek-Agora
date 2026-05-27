import { DebateStatus } from "@agora/shared";
import { AppException } from "../../../common/exceptions/app.exception";
import { AnalysisFailedException } from "../../../common/exceptions/analysis-failed.exception";
import { ILLMClient } from "../../agent/domain/i-llm-client";
import { DebateEntity } from "../../debate/domain/debate.entity";
import { DebateNotFoundException } from "../../debate/domain/debate-not-found.exception";
import { IDebateRepository } from "../../debate/domain/i-debate.repository";
import { IPersonaRepository } from "../../persona/domain/i-persona.repository";
import { PersonaEntity } from "../../persona/domain/persona.entity";
import { AnalysisService } from "../analysis.service";
import { AnalysisResultEntity } from "../domain/analysis-result.entity";
import { IAnalysisResultRepository } from "../domain/i-analysis-result.repository";

function buildValidJson(): string {
  return JSON.stringify({
    groups: [
      {
        id: "tenants",
        name: "Наематели",
        estimatedPopulation: "~1.2 million",
        demographics: "25-45, градско",
        interests: ["достъпно жилище"],
        fears: ["скъп наем", "несигурност"],
        priorities: ["стабилност"],
        stance: "Supportive",
        stanceReason: "Защита от увеличения",
      },
      {
        id: "landlords",
        name: "Наемодатели",
        estimatedPopulation: "~200,000",
        demographics: "Собственици на имоти",
        interests: ["доходност"],
        fears: ["загуба на приходи"],
        priorities: ["свобода на пазара"],
        stance: "Opposed",
        stanceReason: "Ограничава доходността",
      },
    ],
    keyChanges: ["таван на наема", "регистър на имотите"],
    contentiousPoints: ["обхват", "период"],
  });
}

class FakeDebateRepo implements IDebateRepository {
  debate: DebateEntity = {
    id: "debate-1",
    userId: "user-1",
    title: "Bill X",
    billText: "Bill text content",
    sourceType: "text",
    status: DebateStatus.Draft,
    createdAt: new Date("2026-05-27T10:00:00.000Z"),
  };
  statusUpdates: string[] = [];

  async findById(id: string): Promise<DebateEntity | null> {
    if (id !== this.debate.id) return null;
    return this.debate;
  }
  findByUser(): Promise<DebateEntity[]> {
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
  async updateStatus(_id: string, status: string): Promise<DebateEntity> {
    this.statusUpdates.push(status);
    this.debate = { ...this.debate, status };
    return this.debate;
  }
}

class FakePersonaRepo implements IPersonaRepository {
  saved: Omit<PersonaEntity, "id" | "createdAt">[] = [];
  deletedByDebate: string[] = [];

  async findByDebate(): Promise<PersonaEntity[]> {
    return [];
  }
  async saveMany(personas: Omit<PersonaEntity, "id" | "createdAt">[]): Promise<PersonaEntity[]> {
    this.saved.push(...personas);
    return personas.map((p, i) => ({
      ...p,
      id: `persona-${i + 1}`,
      createdAt: new Date(),
    }));
  }
  async updateMany(): Promise<PersonaEntity[]> {
    return [];
  }
  async deleteMany(): Promise<void> {}
  async deleteByDebate(debateId: string): Promise<void> {
    this.deletedByDebate.push(debateId);
  }
}

class FakeAnalysisRepo implements IAnalysisResultRepository {
  saved?: Omit<AnalysisResultEntity, "id" | "createdAt">;
  deletedByDebate: string[] = [];

  async save(
    result: Omit<AnalysisResultEntity, "id" | "createdAt">,
  ): Promise<AnalysisResultEntity> {
    this.saved = result;
    return { ...result, id: "analysis-1", createdAt: new Date() };
  }
  async findByDebate(): Promise<AnalysisResultEntity | null> {
    return null;
  }
  async deleteByDebate(debateId: string): Promise<void> {
    this.deletedByDebate.push(debateId);
  }
}

function makeLLMClient(responses: (string | Error)[]): ILLMClient {
  let call = 0;
  return {
    async *streamCompletion() {
      const response = responses[call] ?? responses[responses.length - 1];
      call++;
      if (response instanceof Error) throw response;
      yield response;
    },
  };
}

describe("AnalysisService", () => {
  let debateRepo: FakeDebateRepo;
  let personaRepo: FakePersonaRepo;
  let analysisRepo: FakeAnalysisRepo;

  beforeEach(() => {
    debateRepo = new FakeDebateRepo();
    personaRepo = new FakePersonaRepo();
    analysisRepo = new FakeAnalysisRepo();
  });

  it("happy path: transitions Draft -> Analyzing -> PersonasPending and saves all artifacts", async () => {
    const llm = makeLLMClient([buildValidJson()]);
    const service = new AnalysisService(debateRepo, personaRepo, analysisRepo, llm);

    const { analysis, personas } = await service.analyze("debate-1");

    expect(debateRepo.statusUpdates).toEqual([
      DebateStatus.Analyzing,
      DebateStatus.PersonasPending,
    ]);
    expect(analysisRepo.saved?.affectedGroups).toHaveLength(2);
    expect(analysis.keyChanges).toContain("таван на наема");
    expect(personas).toHaveLength(2);
    expect(personaRepo.saved[0].color).toBe("sage");
    expect(personaRepo.saved[1].color).toBe("rust");
    expect(personaRepo.saved[0].interests).toEqual(["достъпно жилище"]);
    expect(personaRepo.saved[0].fears).toEqual(["скъп наем", "несигурност"]);
  });

  it("clears stale artifacts before each run", async () => {
    const llm = makeLLMClient([buildValidJson()]);
    const service = new AnalysisService(debateRepo, personaRepo, analysisRepo, llm);
    await service.analyze("debate-1");

    expect(personaRepo.deletedByDebate).toEqual(["debate-1"]);
    expect(analysisRepo.deletedByDebate).toEqual(["debate-1"]);
  });

  it("retries once on invalid JSON, succeeds on second attempt", async () => {
    const llm = makeLLMClient(["not json at all", buildValidJson()]);
    const service = new AnalysisService(debateRepo, personaRepo, analysisRepo, llm);

    const { personas } = await service.analyze("debate-1");
    expect(personas).toHaveLength(2);
    expect(debateRepo.statusUpdates).toEqual([
      DebateStatus.Analyzing,
      DebateStatus.PersonasPending,
    ]);
  });

  it("transitions to AnalysisFailed after two parse failures", async () => {
    const llm = makeLLMClient(["garbage", "still garbage"]);
    const service = new AnalysisService(debateRepo, personaRepo, analysisRepo, llm);

    await expect(service.analyze("debate-1")).rejects.toBeInstanceOf(AnalysisFailedException);
    expect(debateRepo.statusUpdates).toEqual([DebateStatus.Analyzing, DebateStatus.AnalysisFailed]);
  });

  it("does not retry on non-parse errors (network failures bubble immediately)", async () => {
    const networkErr = new Error("ECONNRESET");
    const llm = makeLLMClient([networkErr, buildValidJson()]);
    const service = new AnalysisService(debateRepo, personaRepo, analysisRepo, llm);

    await expect(service.analyze("debate-1")).rejects.toThrow("ECONNRESET");
    expect(debateRepo.statusUpdates).toEqual([DebateStatus.Analyzing, DebateStatus.AnalysisFailed]);
    expect(personaRepo.saved).toHaveLength(0);
  });

  it("allows re-analysis from AnalysisFailed status", async () => {
    debateRepo.debate.status = DebateStatus.AnalysisFailed;
    const llm = makeLLMClient([buildValidJson()]);
    const service = new AnalysisService(debateRepo, personaRepo, analysisRepo, llm);

    const { personas } = await service.analyze("debate-1");
    expect(personas).toHaveLength(2);
  });

  it("throws DebateNotFoundException when debate missing", async () => {
    const llm = makeLLMClient([buildValidJson()]);
    const service = new AnalysisService(debateRepo, personaRepo, analysisRepo, llm);

    await expect(service.analyze("unknown")).rejects.toBeInstanceOf(DebateNotFoundException);
  });

  it("throws AppException when debate not in retryable status", async () => {
    debateRepo.debate.status = DebateStatus.Running;
    const llm = makeLLMClient([buildValidJson()]);
    const service = new AnalysisService(debateRepo, personaRepo, analysisRepo, llm);

    await expect(service.analyze("debate-1")).rejects.toBeInstanceOf(AppException);
  });
});
