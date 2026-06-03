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

// Ring geometry matches the reference circle drawn below
// (center 50% / 48%, width/height 62% -> radius 31% on each axis).
const RING_CX = 50;
const RING_CY = 48;
const RING_RX = 31;
const RING_RY = 31;

// Avatar centers sit on the ring, evenly spaced, first one at the top (12 o'clock).
function ringPositions(count: number): Array<{ top: string; left: string }> {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI;
    const left = RING_CX + RING_RX * Math.sin(angle);
    const top = RING_CY - RING_RY * Math.cos(angle);
    return { top: `${top}%`, left: `${left}%` };
  });
}

type TooltipPlacement = "top" | "bottom" | "left" | "right";

function tooltipPlacement(pos: { top: string; left: string }): TooltipPlacement {
  const top = parseFloat(pos.top);
  const left = parseFloat(pos.left);
  if (left <= 25) return "right";
  if (left >= 75) return "left";
  if (top >= 55) return "top";
  return "bottom";
}

const PLACEMENT_CLASSES: Record<TooltipPlacement, string> = {
  bottom: "left-1/2 top-full -translate-x-1/2 mt-[clamp(4px,0.8cqw,8px)]",
  top: "left-1/2 bottom-full -translate-x-1/2 mb-[clamp(4px,0.8cqw,8px)]",
  right: "left-full top-1/2 -translate-y-1/2 ml-[clamp(4px,0.8cqw,8px)]",
  left: "right-full top-1/2 -translate-y-1/2 mr-[clamp(4px,0.8cqw,8px)]",
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
  const positions = ringPositions(count);
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
        className="@container relative w-full"
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
              className="group absolute z-10 flex flex-col items-center gap-[clamp(4px,0.8cqw,6px)] hover:z-30"
              style={{
                top: pos.top,
                left: pos.left,
                transform: "translate(-50%, -50%)",
              }}
            >
              <PersonaAvatar
                name={persona.name}
                color={persona.color}
                size="clamp(44px, 11cqw, 80px)"
                emotion={emotion}
                active={isActive}
              />
              <span className="text-center text-[clamp(11px,1.6cqw,14px)] font-medium text-ink-primary">
                {shortName(persona.name)}
              </span>
              <span
                className={`pointer-events-none absolute z-20 w-max max-w-[clamp(140px,30cqw,220px)] rounded-xl border border-hair bg-surface/80 px-3 py-2 text-center text-[clamp(10px,1.3cqw,11px)] uppercase leading-snug tracking-[0.14em] text-ink-muted opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 ${PLACEMENT_CLASSES[tooltipPlacement(pos)]}`}
              >
                {persona.demographic}
              </span>
            </div>
          );
        })}

        <div className="absolute left-1/2 top-[48%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
          <div
            className="flex items-center justify-center rounded-xl border border-hair bg-surface"
            style={{ width: "clamp(44px, 8cqw, 64px)", height: "clamp(44px, 8cqw, 64px)" }}
          >
            <FileText
              strokeWidth={1.5}
              className="text-ink-muted"
              style={{ width: "clamp(20px, 3.5cqw, 28px)", height: "clamp(20px, 3.5cqw, 28px)" }}
            />
          </div>
          <span className="font-mono text-[clamp(10px,1.3cqw,11px)] uppercase tracking-[0.08em] text-ink-muted">
            {billCode}
          </span>
        </div>

        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2">
          <span className="font-mono text-[clamp(10px,1.3cqw,11px)] uppercase tracking-[0.08em] text-ink-label">
            {roundLabel}
          </span>
        </div>

        <div className="absolute bottom-[9%] left-1/2 flex -translate-x-1/2 items-center gap-1.5">
          <span className="mr-0.5 inline-block h-2 w-2 rounded-full bg-persona-aubergine" />
          <span className="font-mono text-[clamp(10px,1.3cqw,11px)] uppercase tracking-[0.08em] text-ink-muted">
            Judge - observing
          </span>
        </div>

        <div className="absolute bottom-[3%] left-1/2 flex w-full max-w-[92%] -translate-x-1/2 flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
          {EMOTION_LABELS.map(({ emotion, label }) => (
            <span key={emotion} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: emotionColor(emotion) }}
              />
              <span className="text-[clamp(10px,1.3cqw,11px)] uppercase tracking-[0.08em] text-ink-muted">
                {label}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
