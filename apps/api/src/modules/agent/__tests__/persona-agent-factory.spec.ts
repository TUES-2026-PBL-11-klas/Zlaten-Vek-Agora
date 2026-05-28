import { Test, TestingModule } from "@nestjs/testing";
import { PersonaAgentFactory } from "../domain/persona-agent-factory";
import { PersonaAgent } from "../domain/persona-agent";
import { JudgeAgent } from "../domain/judge-agent";
import { ILLMClient, LLM_CLIENT } from "../domain/i-llm-client";
import { PersonaEntity } from "../../persona/domain/persona.entity";

const makePersona = (override: Partial<PersonaEntity> = {}): PersonaEntity => ({
  id: "persona-1",
  debateId: "debate-1",
  name: "Марина Иванова",
  demographic: "Майка с две деца",
  interests: ["образование", "здравеопазване"],
  fears: ["увеличение на данъците"],
  priorities: ["семейство", "сигурност"],
  color: "sage",
  avatarUrl: null,
  createdAt: new Date(),
  ...override,
});

describe("PersonaAgentFactory", () => {
  let factory: PersonaAgentFactory;

  const mockLlmClient: ILLMClient = {
    streamCompletion: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PersonaAgentFactory, { provide: LLM_CLIENT, useValue: mockLlmClient }],
    }).compile();

    factory = module.get(PersonaAgentFactory);
  });

  describe("create()", () => {
    it("returns a PersonaAgent instance", () => {
      const persona = makePersona();
      const agent = factory.create(persona);
      expect(agent).toBeInstanceOf(PersonaAgent);
    });

    it("sets agent id to persona id", () => {
      const persona = makePersona({ id: "custom-id" });
      const agent = factory.create(persona);
      expect(agent.id).toBe("custom-id");
    });

    it("sets personaName to persona name", () => {
      const persona = makePersona({ name: "Тест Потребител" });
      const agent = factory.create(persona);
      expect(agent.personaName).toBe("Тест Потребител");
    });

    it("creates independent instances for each call", () => {
      const persona = makePersona();
      const agent1 = factory.create(persona);
      const agent2 = factory.create(persona);
      expect(agent1).not.toBe(agent2);
    });
  });

  describe("createJudge()", () => {
    it("returns a JudgeAgent instance", () => {
      const agent = factory.createJudge();
      expect(agent).toBeInstanceOf(JudgeAgent);
    });

    it("sets id to 'judge'", () => {
      const agent = factory.createJudge();
      expect(agent.id).toBe("judge");
    });
  });
});
