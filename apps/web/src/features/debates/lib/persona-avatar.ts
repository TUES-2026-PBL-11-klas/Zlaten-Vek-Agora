const PALETTE: Record<string, string> = {
  sage: "var(--color-persona-sage)",
  rust: "var(--color-persona-rust)",
  mustard: "var(--color-persona-mustard)",
  forest: "var(--color-persona-forest)",
  terracotta: "var(--color-persona-terracotta)",
  aubergine: "var(--color-persona-aubergine)",
  steel: "var(--color-persona-steel)",
};

const FALLBACK = "var(--color-persona-steel)";

export function personaColor(token: string | null | undefined): string {
  if (!token) return FALLBACK;
  const key = token.toLowerCase();
  if (key in PALETTE) return PALETTE[key];
  if (/^#[0-9a-f]{3,8}$/i.test(token)) return token;
  return FALLBACK;
}

export function personaInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}
