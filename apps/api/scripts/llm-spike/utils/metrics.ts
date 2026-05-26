export type ModelKey = "gpt-5" | "gemini-2.5-flash";

// Published pricing as of 2026-05-17 (USD per 1M tokens).
// Source: platform.openai.com/docs/pricing and ai.google.dev/gemini-api/docs/pricing
export const PRICING: Record<ModelKey, { inputPer1M: number; outputPer1M: number }> = {
  "gpt-5": { inputPer1M: 0.625, outputPer1M: 5.0 },
  "gemini-2.5-flash": { inputPer1M: 0.3, outputPer1M: 2.5 },
};

export interface CallMetrics {
  model: ModelKey;
  task: string;
  firstTokenMs: number;
  totalMs: number;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
}

export function calcCost(model: ModelKey, promptTokens: number, completionTokens: number): number {
  const p = PRICING[model];
  return (promptTokens / 1_000_000) * p.inputPer1M + (completionTokens / 1_000_000) * p.outputPer1M;
}

export function printComparison(a: CallMetrics, b: CallMetrics): void {
  const sep = "=".repeat(62);
  const col = (s: string, w = 18) => s.padEnd(w);

  console.log(`\n${sep}`);
  console.log(`COMPARISON: ${a.task}`);
  console.log(sep);
  console.log(`${col("Metric", 24)} ${col(a.model)} ${b.model}`);
  console.log("-".repeat(62));

  const rows: [string, string, string][] = [
    ["First token (ms)", String(a.firstTokenMs), String(b.firstTokenMs)],
    ["Total latency (ms)", String(a.totalMs), String(b.totalMs)],
    ["Prompt tokens", String(a.promptTokens), String(b.promptTokens)],
    ["Completion tokens", String(a.completionTokens), String(b.completionTokens)],
    ["Cost (USD)", `$${a.costUsd.toFixed(6)}`, `$${b.costUsd.toFixed(6)}`],
  ];

  rows.forEach(([label, aVal, bVal]) => {
    console.log(`${col(label, 24)} ${col(aVal)} ${bVal}`);
  });
  console.log("");
}
