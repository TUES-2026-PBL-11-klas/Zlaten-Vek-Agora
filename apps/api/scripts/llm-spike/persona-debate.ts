/**
 * Spike: PersonaAgent comparison - GPT-5 vs Gemini 2.5 Flash
 *
 * Runs one debate round where 3 personas respond to each other on the bill topic.
 * Tests character consistency, counter-argument quality, and streaming latency.
 *
 * Run: pnpm --filter @agora/api spike:persona
 * Requires: OPENAI_API_KEY and GOOGLE_API_KEY in apps/api/.env
 */
import "dotenv/config";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { type CallMetrics, calcCost, printComparison } from "./utils/metrics";

interface Persona {
  id: string;
  name: string;
  age: number;
  occupation: string;
  background: string;
  systemPrompt: string;
}

const PERSONAS: Persona[] = [
  {
    id: "pensioner",
    name: "Ivanka Stoeva",
    age: 72,
    occupation: "Retired teacher",
    background:
      "Ivanka worked 35 years as a primary school teacher in Plovdiv. She lives on a pension of 680 BGN/month, rents out a room to cover utilities, and worries constantly about inflation eroding her savings.",
    systemPrompt: `You are Ivanka Stoeva, a 72-year-old retired teacher from Plovdiv living on 680 BGN/month pension.
You are cautiously hopeful about the bill's pension increase but worried it will not keep pace with inflation.
You speak in a warm, slightly formal tone. You draw on your experience as a teacher and community member.
Keep responses to 3-5 sentences. Never break character.`,
  },
  {
    id: "employer",
    name: "Georgi Petkov",
    age: 43,
    occupation: "Construction company owner (65 employees)",
    background:
      "Georgi built his construction firm from scratch over 15 years. With 65 employees, Article 2 directly hits him. He operates on thin margins in a competitive sector and fears the levy will force layoffs.",
    systemPrompt: `You are Georgi Petkov, a 43-year-old owner of a construction company with 65 employees in Sofia.
Article 2 of the bill will cost you an additional ~8,000 BGN per month in payroll levies.
You are strongly opposed. You speak bluntly, use business language, and cite specific financial numbers.
Keep responses to 3-5 sentences. Never break character.`,
  },
  {
    id: "freelancer",
    name: "Nikola Yordanov",
    age: 35,
    occupation: "Freelance software developer",
    background:
      "Nikola works remotely for EU clients. He earns well but resents being penalised for not being an employee. Article 3 raises his monthly minimum contribution by 317 BGN, which he finds arbitrary.",
    systemPrompt: `You are Nikola Yordanov, a 35-year-old freelance software developer from Sofia earning ~6,000 BGN/month.
Article 3 raises your mandatory social contribution base by 317 BGN/month - money you already self-insure separately.
You are opposed but pragmatic. You speak analytically, occasionally sardonic. You reference EU freelancer policies.
Keep responses to 3-5 sentences. Never break character.`,
  },
];

const TOPIC = `The Social Insurance Code Amendment Bill (Draft 49-354-01-87) proposes raising
minimum pensions to 780 BGN, imposing a 2.5% payroll levy on large employers, and
increasing the minimum contribution base for self-employed persons to 1,250 BGN/month.
Should Article 2 (the employer levy) be passed as written, or renegotiated?`;

const ROUND_CONTEXT = `You are in a structured public debate. The previous speakers said:
- Ivanka Stoeva (pensioner): "The pension increase is long overdue - we have been promised reform for a decade.
  But I worry the levy on employers will lead to layoffs, and the people who need jobs most will suffer first."
- Georgi Petkov (employer): "Eight thousand lev a month extra. That is two junior workers' salaries gone.
  I have 65 employees counting on me. This levy was drafted by people who have never run a business."

Now respond as your character in 3-5 sentences. Address at least one point raised by another speaker.`;

async function runPersonaRound(
  persona: Persona,
  model: "gpt-5" | "gemini-2.5-flash",
  clients: { openai: OpenAI; genAI: GoogleGenerativeAI },
): Promise<CallMetrics> {
  const start = Date.now();
  let firstTokenMs = 0;
  let gotFirstToken = false;
  let promptTokens = 0;
  let completionTokens = 0;

  const userContent = `Topic: ${TOPIC}\n\n${ROUND_CONTEXT}`;

  if (model === "gpt-5") {
    const stream = await clients.openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: persona.systemPrompt },
        { role: "user", content: userContent },
      ],
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
        process.stdout.write(token);
      }
    }
  } else {
    const geminiModel = clients.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: persona.systemPrompt,
    });

    const result = await geminiModel.generateContentStream(userContent);

    for await (const chunk of result.stream) {
      const token = chunk.text();
      if (token) {
        if (!gotFirstToken) {
          firstTokenMs = Date.now() - start;
          gotFirstToken = true;
        }
        process.stdout.write(token);
      }
    }

    const response = await result.response;
    const usage = response.usageMetadata;
    promptTokens = usage?.promptTokenCount ?? 0;
    completionTokens = usage?.candidatesTokenCount ?? 0;
  }

  const totalMs = Date.now() - start;

  return {
    model,
    task: `persona-${persona.id}`,
    firstTokenMs,
    totalMs,
    promptTokens,
    completionTokens,
    costUsd: calcCost(model, promptTokens, completionTokens),
  };
}

async function runAllPersonas(
  model: "gpt-5" | "gemini-2.5-flash",
  clients: { openai: OpenAI; genAI: GoogleGenerativeAI },
): Promise<CallMetrics[]> {
  const results: CallMetrics[] = [];

  for (const persona of PERSONAS) {
    console.log(`\n--- ${model}: ${persona.name} (${persona.occupation}) ---`);
    const metrics = await runPersonaRound(persona, model, clients);
    console.log("\n");
    results.push(metrics);
  }

  return results;
}

function aggregateMetrics(
  metrics: CallMetrics[],
  model: "gpt-5" | "gemini-2.5-flash",
): CallMetrics {
  const n = metrics.length;
  return {
    model,
    task: "persona-debate-avg",
    firstTokenMs: Math.round(metrics.reduce((s, m) => s + m.firstTokenMs, 0) / n),
    totalMs: Math.round(metrics.reduce((s, m) => s + m.totalMs, 0) / n),
    promptTokens: Math.round(metrics.reduce((s, m) => s + m.promptTokens, 0) / n),
    completionTokens: Math.round(metrics.reduce((s, m) => s + m.completionTokens, 0) / n),
    costUsd: metrics.reduce((s, m) => s + m.costUsd, 0) / n,
  };
}

async function main() {
  console.log("=== LLM Spike: PersonaAgent ===");
  console.log("Comparing GPT-5 vs Gemini 2.5 Flash on persona debate (1 round, 3 personas)\n");

  const openaiKey = process.env.OPENAI_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;
  if (!openaiKey) throw new Error("OPENAI_API_KEY is not set");
  if (!googleKey) throw new Error("GOOGLE_API_KEY is not set");

  const clients = {
    openai: new OpenAI({ apiKey: openaiKey }),
    genAI: new GoogleGenerativeAI(googleKey),
  };

  console.log("\n====== GPT-5 ROUND ======");
  const gptResults = await runAllPersonas("gpt-5", clients);

  console.log("\n====== GEMINI 2.5 FLASH ROUND ======");
  const geminiResults = await runAllPersonas("gemini-2.5-flash", clients);

  const gptAvg = aggregateMetrics(gptResults, "gpt-5");
  const geminiAvg = aggregateMetrics(geminiResults, "gemini-2.5-flash");

  printComparison(gptAvg, geminiAvg);

  const totalGpt = gptResults.reduce((s, m) => s + m.costUsd, 0);
  const totalGemini = geminiResults.reduce((s, m) => s + m.costUsd, 0);
  console.log(
    `Total cost for 3-persona round - GPT-5: $${totalGpt.toFixed(6)}, Gemini: $${totalGemini.toFixed(6)}`,
  );
  console.log(`Cost ratio (GPT-5 / Gemini): ${(totalGpt / totalGemini).toFixed(1)}x\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
