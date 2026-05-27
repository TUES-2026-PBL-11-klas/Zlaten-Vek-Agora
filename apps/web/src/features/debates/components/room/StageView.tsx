import { useMemo } from "react";
import { FileText } from "lucide-react";
import type { DebateDetailDto, DebateDetailMessageDto, Emotion } from "@agora/shared";
import { PersonaAvatar } from "../PersonaAvatar";
import { EMOTION_LABELS, emotionColor } from "../../lib/emotion-color";

interface StageViewProps {
  personas: DebateDetailDto["personas"];
  activePersonaId: string | null;
  allMessages: DebateDetailMessageDto[];
  currentIndex: number;
  billCode: string;
  roundLabel: string;
  streamEmotions?: Map<string, string>;
}

const POSITIONS: Record<number, Array<{ top: string; left: string }>> = {
  1: [{ top: "15%", left: "50%" }],
  2: [
    { top: "15%", left: "35%" },
    { top: "15%", left: "65%" },
  ],
  3: [
    { top: "12%", left: "50%" },
    { top: "68%", left: "22%" },
    { top: "68%", left: "78%" },
  ],
  4: [
    { top: "12%", left: "50%" },
    { top: "48%", left: "85%" },
    { top: "82%", left: "50%" },
    { top: "48%", left: "15%" },
  ],
  5: [
    { top: "10%", left: "50%" },
    { top: "35%", left: "85%" },
    { top: "74%", left: "74%" },
    { top: "74%", left: "26%" },
    { top: "35%", left: "15%" },
  ],
};

function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function buildEmotionMap(
  messages: DebateDetailMessageDto[],
  upToIndex: number,
): Map<string, Emotion> {
  const map = new Map<string, Emotion>();
  for (let i = 0; i <= upToIndex && i < messages.length; i++) {
    map.set(messages[i].persona.id, messages[i].emotion);
  }
  return map;
}

export function StageView({
  personas,
  activePersonaId,
  allMessages,
  currentIndex,
  billCode,
  roundLabel,
  streamEmotions,
}: StageViewProps) {
  const count = personas.length;
  const positions = POSITIONS[Math.min(count, 5) as keyof typeof POSITIONS] ?? POSITIONS[5]!;
  const emotionMap = useMemo(() => {
    const base = buildEmotionMap(allMessages, currentIndex);
    if (streamEmotions) {
      for (const [id, emotion] of streamEmotions) {
        base.set(id, emotion as Emotion);
      }
    }
    return base;
  }, [allMessages, currentIndex, streamEmotions]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-hair bg-surface">
      <div
        className="relative w-full"
        style={{
          aspectRatio: "4 / 3.2",
          background:
            "radial-gradient(circle at center, var(--color-surface) 0%, var(--color-surface-2) 80%)",
        }}
      >
        <div
          className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-hair"
          style={{ width: "62%", height: "62%", opacity: 0.6 }}
        />

        {personas.map((persona, idx) => {
          const pos = positions[Math.min(idx, positions.length - 1)];
          const isActive = persona.id === activePersonaId;
          const emotion = emotionMap.get(persona.id);

          return (
            <div
              key={persona.id}
              className="absolute flex flex-col items-center gap-1.5"
              style={{
                top: pos.top,
                left: pos.left,
                transform: "translate(-50%, -50%)",
              }}
            >
              <PersonaAvatar
                name={persona.name}
                color={persona.color}
                size={80}
                emotion={emotion}
                active={isActive}
              />
              <span className="text-center text-[14px] font-medium text-ink-primary">
                {shortName(persona.name)}
              </span>
              <span className="text-[11px] uppercase tracking-[0.14em] text-ink-label">
                {persona.demographic}
              </span>
            </div>
          );
        })}

        <div className="absolute left-1/2 top-[48%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-hair bg-surface">
            <FileText size={28} strokeWidth={1.5} className="text-ink-muted" />
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted">
            {billCode}
          </span>
        </div>

        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-label">
            {roundLabel}
          </span>
        </div>

        <div className="absolute bottom-[9%] left-1/2 flex -translate-x-1/2 items-center gap-1.5">
          <span className="mr-0.5 inline-block h-2 w-2 rounded-full bg-persona-aubergine" />
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted">
            Judge - observing
          </span>
        </div>

        <div className="absolute bottom-[3%] left-1/2 flex -translate-x-1/2 items-center gap-4">
          {EMOTION_LABELS.map(({ emotion, label }) => (
            <span key={emotion} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: emotionColor(emotion) }}
              />
              <span className="text-[11px] uppercase tracking-[0.08em] text-ink-muted">
                {label}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
