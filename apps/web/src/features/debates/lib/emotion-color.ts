import type { Emotion } from "@agora/shared";

const EMOTION_MAP: Record<Emotion, string> = {
  calm: "var(--color-persona-sage)",
  confident: "var(--color-persona-mustard)",
  pensive: "var(--color-persona-aubergine)",
  anxious: "var(--color-persona-steel)",
  tense: "var(--color-persona-terracotta)",
};

const EMOTION_HEX: Record<Emotion, string> = {
  calm: "#7B8F6A",
  confident: "#C7A03A",
  pensive: "#6B3F5E",
  anxious: "#6E7E8A",
  tense: "#C04B3B",
};

export const EMOTION_LABELS: { emotion: Emotion; label: string }[] = [
  { emotion: "calm", label: "Calm" },
  { emotion: "confident", label: "Confident" },
  { emotion: "pensive", label: "Pensive" },
  { emotion: "anxious", label: "Anxious" },
  { emotion: "tense", label: "Tense" },
];

export function emotionColor(emotion: Emotion): string {
  return EMOTION_MAP[emotion] ?? "var(--color-persona-steel)";
}

export function emotionHex(emotion: Emotion): string {
  return EMOTION_HEX[emotion] ?? "#6E7E8A";
}
