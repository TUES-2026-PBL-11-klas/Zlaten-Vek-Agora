import { RoundType } from "@agora/shared";
import { AgentContext, LLMMessage, LLMOptions } from "../../../agent/domain/agent-context";
import { ILLMClient } from "../../../agent/domain/i-llm-client";
import { ANALYSIS_SYSTEM_PROMPT, AnalysisAgent } from "../analysis-agent";

describe("AnalysisAgent", () => {
  const validJson = JSON.stringify({
    groups: [
      {
        id: "tenants",
        name: "Наематели",
        estimatedPopulation: "~1.2 million",
        demographics: "Възраст 25-45, градско",
        fears: ["скъп наем"],
        priorities: ["стабилност"],
        stance: "Supportive",
        stanceReason: "Защита от увеличения",
      },
    ],
    keyChanges: ["таван на наема"],
    contentiousPoints: ["обхват"],
  });

  let receivedMessages: LLMMessage[] | undefined;
  let receivedOptions: LLMOptions | undefined;

  const mockClient: ILLMClient = {
    async *streamCompletion(messages, options) {
      receivedMessages = messages;
      receivedOptions = options;
      const halfway = Math.floor(validJson.length / 2);
      yield validJson.slice(0, halfway);
      yield validJson.slice(halfway);
    },
  };

  beforeEach(() => {
    receivedMessages = undefined;
    receivedOptions = undefined;
  });

  it("exposes 'analysis-agent' id", () => {
    const agent = new AnalysisAgent(mockClient);
    expect(agent.id).toBe("analysis-agent");
  });

  it("streams JSON tokens that parse to expected structure", async () => {
    const agent = new AnalysisAgent(mockClient);
    const ctx: AgentContext = {
      billText: "Sample bill text",
      history: [],
      roundNumber: 0,
      roundType: RoundType.Position,
    };

    let collected = "";
    for await (const token of agent.generateResponse(ctx)) {
      collected += token;
    }

    const parsed = JSON.parse(collected);
    expect(parsed.groups).toHaveLength(1);
    expect(parsed.groups[0].id).toBe("tenants");
    expect(parsed.keyChanges).toEqual(["таван на наема"]);
    expect(parsed.contentiousPoints).toEqual(["обхват"]);
  });

  it("passes system prompt and JSON response format to LLM", async () => {
    const agent = new AnalysisAgent(mockClient);
    const ctx: AgentContext = {
      billText: "Hello bill",
      history: [],
      roundNumber: 0,
      roundType: RoundType.Position,
    };

    for await (const _ of agent.generateResponse(ctx)) {
      // drain
    }

    expect(receivedMessages).toBeDefined();
    expect(receivedMessages![0]).toEqual({
      role: "system",
      content: ANALYSIS_SYSTEM_PROMPT,
    });
    expect(receivedMessages![1].role).toBe("user");
    expect(receivedMessages![1].content).toContain("Hello bill");
    expect(receivedOptions?.responseFormat).toEqual({ type: "json_object" });
    expect(receivedOptions?.temperature).toBe(0.3);
  });
});
