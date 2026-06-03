import { RoundType } from "@agora/shared";
import { AgentContext, LLMMessage, LLMOptions } from "../agent-context";
import { ILLMClient } from "../i-llm-client";
import { JudgeAgent } from "../judge-agent";

const VALID_OUTPUT = {
  contradictions: [
    "Tenants treat rent caps as protection; operators treat them as expropriation.",
    "Builders want predictability; council wants flexibility to revise yearly.",
    "First-time buyers feel sidelined by both sides of the rental debate.",
  ],
  commonGround: [
    "Everyone accepts that current rental volatility is unsustainable.",
    "All sides agree new construction must continue, not stall.",
    "The chamber accepts a phased introduction over a cliff edge.",
  ],
  compromise: [
    "Apply a 4% annual cap in regulated zones with a sunset clause after three years.",
    "Exempt buildings under five units to protect small operators.",
    "Pair the cap with a tax credit to keep new construction on the table.",
  ],
  participantShifts: [
    {
      personaId: "p1",
      openedQuote: "tenants need predictable rents.",
      closedQuote: "a phased cap with review keeps tenants protected.",
      shiftPercent: 18,
    },
    {
      personaId: "p2",
      openedQuote: "a cap would freeze new construction.",
      closedQuote: "with an SME carve-out i can live with a phased cap.",
      shiftPercent: 42,
    },
  ],
  closingStatement: "the chamber leaves with a workable shape, not a settled one.",
};

class RecordingLLMClient implements ILLMClient {
  lastMessages: LLMMessage[] = [];
  lastOptions: LLMOptions | undefined;

  constructor(private readonly chunks: string[]) {}

  async *streamCompletion(messages: LLMMessage[], options?: LLMOptions): AsyncIterable<string> {
    this.lastMessages = messages;
    this.lastOptions = options;
    for (const chunk of this.chunks) {
      yield chunk;
    }
  }
}

function chunkify(text: string, size = 32): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

describe("JudgeAgent", () => {
  const context: AgentContext = {
    billText: "stub bill text",
    history: [{ role: "user", content: "stub transcript" }],
    roundNumber: 4,
    roundType: RoundType.CommonGround,
  };

  it("streams tokens that reconstruct into the structured M4 contract", async () => {
    const payload = JSON.stringify(VALID_OUTPUT);
    const llm = new RecordingLLMClient(chunkify(payload, 24));
    const agent = new JudgeAgent(llm);

    let buffer = "";
    for await (const token of agent.generateResponse(context)) {
      buffer += token;
    }

    const parsed = JSON.parse(buffer);
    expect(parsed.contradictions).toHaveLength(3);
    expect(parsed.commonGround).toHaveLength(3);
    expect(parsed.compromise).toHaveLength(3);
    expect(parsed.participantShifts).toHaveLength(2);
    expect(parsed.closingStatement).toMatch(/\.$/);
  });

  it("prepends a system prompt before forwarding history to the LLM client", async () => {
    const llm = new RecordingLLMClient(["{", "}"]);
    const agent = new JudgeAgent(llm);

    for await (const _ of agent.generateResponse(context)) {
      // drain
    }

    expect(llm.lastMessages.length).toBeGreaterThanOrEqual(2);
    expect(llm.lastMessages[0].role).toBe("system");
    expect(llm.lastMessages[0].content).toMatch(/impartial parliamentary mediator/i);
    expect(llm.lastMessages).toContainEqual({ role: "user", content: "stub transcript" });
    expect(llm.lastMessages.at(-1)).toEqual({
      role: "user",
      content: "Provide your structured synthesis now as a JSON object.",
    });
    expect(llm.lastOptions?.temperature).toBeLessThanOrEqual(0.5);
    expect(llm.lastOptions?.responseFormat?.type).toBe("json_object");
  });

  it("satisfies the IDebateAgent contract (id + generateResponse)", () => {
    const llm = new RecordingLLMClient([]);
    const agent = new JudgeAgent(llm);
    expect(agent.id).toBe("judge");
    expect(typeof agent.generateResponse).toBe("function");
  });
});
