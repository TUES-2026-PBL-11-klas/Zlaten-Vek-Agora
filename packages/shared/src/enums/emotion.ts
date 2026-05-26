export const Emotion = {
  Calm: "calm",
  Confident: "confident",
  Pensive: "pensive",
  Anxious: "anxious",
  Tense: "tense",
} as const;

export type Emotion = (typeof Emotion)[keyof typeof Emotion];

export const EMOTIONS: readonly Emotion[] = [
  Emotion.Calm,
  Emotion.Confident,
  Emotion.Pensive,
  Emotion.Anxious,
  Emotion.Tense,
] as const;
