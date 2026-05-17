/**
 * Spike: AnalysisAgent comparison - GPT-5 vs Gemini 2.5 Flash
 *
 * Feeds a real Bulgarian bill excerpt to both models and asks them to extract
 * affected groups as structured JSON. Measures latency, token usage, and cost.
 *
 * Run: pnpm --filter @agora/api spike:analysis
 * Requires: OPENAI_API_KEY and GOOGLE_API_KEY in apps/api/.env
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { type CallMetrics, calcCost, printComparison } from './utils/metrics';

const BILL_TEXT = `
ЗАКОН ЗА ИЗМЕНЕНИЕ И ДОПЪЛНЕНИЕ НА КОДЕКСА ЗА СОЦИАЛНО ОСИГУРЯВАНЕ
(Bill on Amendment and Supplementation of the Social Insurance Code)
Draft No. 49-354-01-87, introduced 15 March 2026

Article 1. The minimum pension for persons who have fulfilled the required length of
service shall be increased to 780 BGN (approx. €398) per month from 1 January 2027.
The National Social Security Institute shall cover the difference for pensions currently
below this threshold.

Article 2. Employers with more than 50 registered employees shall pay an additional
social contribution levy of 2.5% on gross payroll above the national average wage.
Collected funds are directed to the Pension Equalisation Fund.

Article 3. The minimum monthly social security contribution base for self-employed
persons and registered freelancers shall be increased from 933 BGN to 1,250 BGN.

Article 4. Public sector employees in education, healthcare, and administration shall
receive a 12% salary supplement funded through reallocation of 0.4% of GDP from
the central budget reserve.

Article 5. Small and medium enterprises (10-49 employees) may apply for a monthly
tax credit of 450 BGN per full-time employee to offset increased labour costs.

Article 6. The maximum deductible contribution to voluntary supplementary pension
schemes (third pillar) shall be raised from 10% to 15% of annual taxable income,
capped at 2,500 BGN per year.

Article 7. Persons past statutory retirement age who continue employment shall earn
a bonus pension coefficient of 0.3% per additional month of contributions, replacing
the existing flat supplement.

Article 8. Agricultural cooperatives and seasonal workers have a 24-month transitional
period before Article 2 compliance is mandatory, subject to annual NRA audit.
`.trim();

const SYSTEM_PROMPT = `You are an expert legislative analyst specialising in Bulgarian social policy.
Analyse the provided bill text and extract 4-6 distinct groups directly affected by this legislation.

For each group return valid JSON matching this schema:
{
  "groups": [
    {
      "id": "snake_case_slug",
      "name": "Short group label",
      "estimatedPopulation": "~X million or ~X,000",
      "demographics": "Age range, income level, region, employment status",
      "fears": ["fear 1", "fear 2", "fear 3"],
      "priorities": ["priority 1", "priority 2", "priority 3"],
      "stance": "Supportive | Opposed | Mixed",
      "stanceReason": "One sentence explanation"
    }
  ]
}

Return ONLY the JSON object, no markdown fences, no extra text.`;

const USER_PROMPT = `Bill text:\n\n${BILL_TEXT}`;

async function runGpt5(): Promise<CallMetrics> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  const client = new OpenAI({ apiKey });
  const start = Date.now();
  let firstTokenMs = 0;
  let gotFirstToken = false;
  let output = '';
  let promptTokens = 0;
  let completionTokens = 0;

  console.log('\n--- GPT-5 Analysis ---');

  const stream = await client.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: USER_PROMPT },
    ],
    response_format: { type: 'json_object' },
    stream: true,
    stream_options: { include_usage: true },
  });

  for await (const chunk of stream) {
    if (chunk.usage) {
      promptTokens = chunk.usage.prompt_tokens;
      completionTokens = chunk.usage.completion_tokens;
    }
    const token = chunk.choices[0]?.delta?.content ?? '';
    if (token) {
      if (!gotFirstToken) {
        firstTokenMs = Date.now() - start;
        gotFirstToken = true;
      }
      output += token;
      process.stdout.write(token);
    }
  }

  const totalMs = Date.now() - start;
  console.log('\n');

  try {
    const parsed = JSON.parse(output) as { groups: unknown[] };
    console.log(`GPT-5 extracted ${parsed.groups?.length ?? 0} groups`);
  } catch {
    console.error('GPT-5: JSON parse failed');
  }

  return {
    model: 'gpt-5',
    task: 'bill-analysis',
    firstTokenMs,
    totalMs,
    promptTokens,
    completionTokens,
    costUsd: calcCost('gpt-5', promptTokens, completionTokens),
  };
}

async function runGemini(): Promise<CallMetrics> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY is not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
    systemInstruction: SYSTEM_PROMPT,
  });

  const start = Date.now();
  let firstTokenMs = 0;
  let gotFirstToken = false;
  let output = '';

  console.log('\n--- Gemini 2.5 Flash Analysis ---');

  const result = await model.generateContentStream(USER_PROMPT);

  for await (const chunk of result.stream) {
    const token = chunk.text();
    if (token) {
      if (!gotFirstToken) {
        firstTokenMs = Date.now() - start;
        gotFirstToken = true;
      }
      output += token;
      process.stdout.write(token);
    }
  }

  const totalMs = Date.now() - start;
  console.log('\n');

  const response = await result.response;
  const usage = response.usageMetadata;
  const promptTokens = usage?.promptTokenCount ?? 0;
  const completionTokens = usage?.candidatesTokenCount ?? 0;

  try {
    const parsed = JSON.parse(output) as { groups: unknown[] };
    console.log(`Gemini extracted ${parsed.groups?.length ?? 0} groups`);
  } catch {
    console.error('Gemini: JSON parse failed');
  }

  return {
    model: 'gemini-2.5-flash',
    task: 'bill-analysis',
    firstTokenMs,
    totalMs,
    promptTokens,
    completionTokens,
    costUsd: calcCost('gemini-2.5-flash', promptTokens, completionTokens),
  };
}

async function main() {
  console.log('=== LLM Spike: AnalysisAgent ===');
  console.log('Comparing GPT-5 vs Gemini 2.5 Flash on bill group extraction\n');

  const gptMetrics = await runGpt5();
  const geminiMetrics = await runGemini();

  printComparison(gptMetrics, geminiMetrics);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
