/**
 * Spike: JudgeAgent comparison - GPT-5 vs Gemini 2.5 Flash
 *
 * Feeds a synthetic 3-persona, 3-round debate transcript and asks each model
 * to synthesise conflicts, common ground, and compromises as structured JSON.
 * Runs each model 10 times and reports JSON validity rate.
 *
 * Run: pnpm --filter @agora/api spike:judge
 * Requires: OPENAI_API_KEY and GOOGLE_API_KEY in apps/api/.env
 */
import "dotenv/config";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { type CallMetrics, calcCost, printComparison } from "./utils/metrics";

const TRANSCRIPT = `
=== DEBATE TRANSCRIPT ===
Topic: Social Insurance Code Amendment Bill - Article 2 (employer levy)

ROUND 1
Ivanka Stoeva (Pensioner): The pension increase to 780 BGN is desperately needed. We have watched
our purchasing power shrink for a decade. I understand employers are worried, but pensioners are
already sacrificing - we cannot wait any longer for a dignified minimum.

Georgi Petkov (Employer): Eight thousand lev extra per month. That is two full-time workers' salaries.
I built this company over fifteen years and now I am told to fund a pension gap that should be the
state's responsibility. If this passes as written, I will have to restructure - and some people
will lose jobs entirely.

Nikola Yordanov (Freelancer): I find it revealing that the bill targets employers and the self-employed
but leaves state-owned enterprises largely untouched. My contribution base rises by 317 BGN monthly
even though I already pay for private health and pension insurance. This is double taxation by another name.

ROUND 2
Ivanka Stoeva: I hear Mr Petkov's concern about jobs, and I do not want layoffs either - that would
hurt the same families I am speaking for. But the alternative is pensioners choosing between food and
heating. Perhaps the levy could be phased in over 18 months instead of applied immediately.

Georgi Petkov: A phase-in is better than nothing, but the fundamental problem remains: we are taxing
the wrong entity. The pension deficit is structural - it stems from decades of under-contribution and
demographic decline. Taxing competitive private employers does not fix the underlying model.

Nikola Yordanov: Petkov is correct on the structural point, though I note that large employers have
benefited enormously from below-market wages sustained by weak social protections. A levy specifically
tied to wages above the national average is actually more progressive than a flat contribution rate.
My objection is to Article 3, not Article 2.

ROUND 3
Ivanka Stoeva: I am encouraged that both of you accept the pension increase in principle. Perhaps we
can agree: Article 1 passes, Article 2 is phased in with an SME carve-out, and Article 3 is sent back
to committee for a cap-based revision that does not penalise lower-earning freelancers.

Georgi Petkov: I could accept Article 2 with a two-year phase-in and a clause that waives the levy
if employment headcount drops. That protects jobs while still building the fund. The current text has
no employment safeguard at all.

Nikola Yordanov: A headcount-protection clause is a good start. I would add an income floor for
Article 3 - freelancers earning below 2,500 BGN monthly should be exempt from the increased base.
That keeps the burden on those who can genuinely afford it.
`.trim();

const SYSTEM_PROMPT = `You are an impartial parliamentary mediator synthesising a structured debate transcript.
Your task is to produce a JSON analysis with exactly this structure:

{
  "conflicts": [
    {
      "parties": ["party A", "party B"],
      "issue": "One sentence describing the core disagreement",
      "severity": "High | Medium | Low"
    }
  ],
  "commonGround": [
    "Statement of shared position 1",
    "Statement of shared position 2"
  ],
  "compromises": [
    {
      "description": "Proposed compromise in one sentence",
      "acceptedBy": ["party list"],
      "feasibility": "High | Medium | Low"
    }
  ],
  "overallTone": "Collaborative | Adversarial | Mixed",
  "recommendedNextStep": "One actionable sentence"
}

Return ONLY the JSON. No markdown fences, no preamble.`;

const USER_PROMPT = `Synthesise this debate transcript:\n\n${TRANSCRIPT}`;

const RUNS = 10;

interface RunResult {
  valid: boolean;
  firstTokenMs: number;
  totalMs: number;
  promptTokens: number;
  completionTokens: number;
}

async function singleRunGpt5(client: OpenAI): Promise<RunResult> {
  const start = Date.now();
  let firstTokenMs = 0;
  let gotFirstToken = false;
  let output = "";
  let promptTokens = 0;
  let completionTokens = 0;

  const stream = await client.chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: USER_PROMPT },
    ],
    response_format: { type: "json_object" },
    stream: true,
    stream_options: { include_usage: true },
  });

  for await (const chunk of stream) {
    if (chunk.usage) {
      promptTokens = chunk.usage.prompt_tokens;
      completionTokens = chunk.usage.completion_tokens;
    }
    const token = chunk.choices[0]?.delta?.content ?? "";
    if (token) {
      if (!gotFirstToken) {
        firstTokenMs = Date.now() - start;
        gotFirstToken = true;
      }
      output += token;
    }
  }

  let valid = false;
  try {
    const parsed = JSON.parse(output) as Record<string, unknown>;
    valid =
      Array.isArray(parsed.conflicts) &&
      Array.isArray(parsed.commonGround) &&
      Array.isArray(parsed.compromises);
  } catch {
    valid = false;
  }

  return { valid, firstTokenMs, totalMs: Date.now() - start, promptTokens, completionTokens };
}

async function singleRunGemini(
  model: ReturnType<InstanceType<typeof GoogleGenerativeAI>["getGenerativeModel"]>,
): Promise<RunResult> {
  const start = Date.now();
  let firstTokenMs = 0;
  let gotFirstToken = false;
  let output = "";

  const result = await model.generateContentStream(USER_PROMPT);

  for await (const chunk of result.stream) {
    const token = chunk.text();
    if (token) {
      if (!gotFirstToken) {
        firstTokenMs = Date.now() - start;
        gotFirstToken = true;
      }
      output += token;
    }
  }

  const response = await result.response;
  const usage = response.usageMetadata;
  const promptTokens = usage?.promptTokenCount ?? 0;
  const completionTokens = usage?.candidatesTokenCount ?? 0;

  let valid = false;
  try {
    const parsed = JSON.parse(output) as Record<string, unknown>;
    valid =
      Array.isArray(parsed.conflicts) &&
      Array.isArray(parsed.commonGround) &&
      Array.isArray(parsed.compromises);
  } catch {
    valid = false;
  }

  return { valid, firstTokenMs, totalMs: Date.now() - start, promptTokens, completionTokens };
}

function summarise(results: RunResult[], model: "gpt-5" | "gemini-2.5-flash"): CallMetrics {
  const validCount = results.filter((r) => r.valid).length;
  const avg = <K extends keyof RunResult>(key: K) =>
    Math.round(results.reduce((s, r) => s + (r[key] as number), 0) / results.length);

  const avgPrompt = avg("promptTokens");
  const avgCompletion = avg("completionTokens");

  console.log(`${model}: ${validCount}/${RUNS} valid JSON responses`);

  return {
    model,
    task: `judge-synthesis (${validCount}/${RUNS} valid JSON)`,
    firstTokenMs: avg("firstTokenMs"),
    totalMs: avg("totalMs"),
    promptTokens: avgPrompt,
    completionTokens: avgCompletion,
    costUsd: calcCost(model, avgPrompt, avgCompletion),
  };
}

async function main() {
  console.log("=== LLM Spike: JudgeAgent ===");
  console.log(`Comparing GPT-5 vs Gemini 2.5 Flash on transcript synthesis (${RUNS} runs each)\n`);

  const openaiKey = process.env.OPENAI_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;
  if (!openaiKey) throw new Error("OPENAI_API_KEY is not set");
  if (!googleKey) throw new Error("GOOGLE_API_KEY is not set");

  const openaiClient = new OpenAI({ apiKey: openaiKey });
  const genAI = new GoogleGenerativeAI(googleKey);
  const geminiModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
    systemInstruction: SYSTEM_PROMPT,
  });

  console.log("Running GPT-5...");
  const gptResults: RunResult[] = [];
  for (let i = 0; i < RUNS; i++) {
    process.stdout.write(`  Run ${i + 1}/${RUNS}... `);
    const r = await singleRunGpt5(openaiClient);
    gptResults.push(r);
    console.log(`${r.valid ? "VALID" : "INVALID"} (${r.totalMs}ms)`);
  }

  console.log("\nRunning Gemini 2.5 Flash...");
  const geminiResults: RunResult[] = [];
  for (let i = 0; i < RUNS; i++) {
    process.stdout.write(`  Run ${i + 1}/${RUNS}... `);
    const r = await singleRunGemini(geminiModel);
    geminiResults.push(r);
    console.log(`${r.valid ? "VALID" : "INVALID"} (${r.totalMs}ms)`);
  }

  console.log("");
  const gptMetrics = summarise(gptResults, "gpt-5");
  const geminiMetrics = summarise(geminiResults, "gemini-2.5-flash");

  printComparison(gptMetrics, geminiMetrics);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
