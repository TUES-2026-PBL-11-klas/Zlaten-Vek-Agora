#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const SOURCE_SCHEMA = path.join(__dirname, "..", "prisma", "schema.prisma");

function fail(reason, fix) {
  const bar = "─".repeat(60);
  console.error("");
  console.error(bar);
  console.error("  Prisma client preflight failed");
  console.error(bar);
  console.error(`  Reason: ${reason}`);
  console.error(`  Fix:    ${fix}`);
  console.error(bar);
  console.error("");
  process.exit(1);
}

let Prisma;
try {
  ({ Prisma } = require("@prisma/client"));
} catch {
  fail("@prisma/client is not installed.", "pnpm install");
}

const generatedModels = Prisma?.dmmf?.datamodel?.models;
if (!Array.isArray(generatedModels) || generatedModels.length === 0) {
  fail(
    "Generated Prisma client has no datamodel (never generated).",
    "pnpm --filter @agora/api db:generate",
  );
}

const sourceText = fs.readFileSync(SOURCE_SCHEMA, "utf8");
const sourceModelNames = new Set();
const modelHeaderRegex = /model\s+(\w+)\s*\{/g;
let header;
while ((header = modelHeaderRegex.exec(sourceText)) !== null) {
  sourceModelNames.add(header[1]);
}

const generatedModelNames = new Set(generatedModels.map((m) => m.name));

const missing = [...sourceModelNames].filter((n) => !generatedModelNames.has(n));
if (missing.length > 0) {
  fail(
    `Generated Prisma client is missing models: ${missing.join(", ")}.`,
    "pnpm --filter @agora/api db:generate",
  );
}

const scalarKinds = new Set(["scalar", "enum"]);

function scalarFieldsFromSource(modelName) {
  const block = sourceText.match(new RegExp(`model\\s+${modelName}\\s*\\{([\\s\\S]*?)\\}`));
  if (!block) return [];
  const fields = [];
  for (const rawLine of block[1].split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//") || line.startsWith("@@")) continue;
    const m = line.match(/^(\w+)\s+(\w+)(\??)(\[\])?/);
    if (!m) continue;
    const [, name, type, optional, list] = m;
    if (/@relation\b/.test(line)) continue;
    if (sourceModelNames.has(type)) continue;
    fields.push({ name, isOptional: optional === "?", isList: Boolean(list) });
  }
  fields.sort((a, b) => a.name.localeCompare(b.name));
  return fields;
}

function scalarFieldsFromGenerated(model) {
  return model.fields
    .filter((f) => scalarKinds.has(f.kind))
    .map((f) => ({ name: f.name, isOptional: !f.isRequired, isList: f.isList }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const drift = [];
for (const model of generatedModels) {
  if (!sourceModelNames.has(model.name)) continue;
  const fromSource = JSON.stringify(scalarFieldsFromSource(model.name));
  const fromGenerated = JSON.stringify(scalarFieldsFromGenerated(model));
  if (fromSource !== fromGenerated) {
    drift.push(model.name);
  }
}

if (drift.length > 0) {
  fail(
    `Generated Prisma client is out of date for models: ${drift.join(", ")}.`,
    "pnpm --filter @agora/api db:generate",
  );
}
