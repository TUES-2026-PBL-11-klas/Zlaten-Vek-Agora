import { AgentContext } from "../agent-context";
import { BaseAgent } from "../base-agent";
import { ILLMClient } from "../i-llm-client";

class SmokeAgent extends BaseAgent {
  async *generateResponse(_context: AgentContext): AsyncIterable<string> {
    yield "hello";
    yield " world";
  }
}

const mockLLMClient: ILLMClient = {
  async *streamCompletion() {
    yield "token";
  },
};

describe("BaseAgent", () => {
  let agent: SmokeAgent;

  beforeEach(() => {
    agent = new SmokeAgent("smoke-1", "test persona", mockLLMClient);
  });

  it("exposes id", () => {
    expect(agent.id).toBe("smoke-1");
  });

  it("generateResponse streams tokens", async () => {
    const ctx: AgentContext = { billText: "bill", history: [], roundNumber: 1 };
    const tokens: string[] = [];
    for await (const token of agent.generateResponse(ctx)) {
      tokens.push(token);
    }
    expect(tokens).toEqual(["hello", " world"]);
  });

  it("satisfies IDebateAgent contract", () => {
    expect(typeof agent.id).toBe("string");
    expect(typeof agent.generateResponse).toBe("function");
  });
});
