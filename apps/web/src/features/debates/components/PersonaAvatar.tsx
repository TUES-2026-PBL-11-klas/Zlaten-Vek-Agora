import type { Emotion } from "@agora/shared";
import { personaColor, personaInitial } from "../lib/persona-avatar";
import { emotionHex } from "../lib/emotion-color";

interface PersonaAvatarProps {
  name: string;
  color: string;
  size?: number | string;
  ring?: boolean;
  emotion?: Emotion;
  active?: boolean;
}

export function PersonaAvatar({
  name,
  color,
  size = 32,
  ring = false,
  emotion,
  active = false,
}: PersonaAvatarProps) {
  const len = typeof size === "number" ? `${size}px` : size;
  const isLarge = typeof size === "number" ? size >= 56 : true;
  const glow = emotion ? `0 0 calc(${len} * 0.4) ${emotionHex(emotion)}66` : undefined;
  const activeRing = active
    ? `0 0 0 3px var(--color-surface), 0 0 0 6px ${personaColor(color)}`
    : undefined;
  const shadows = [glow, activeRing].filter(Boolean).join(", ") || undefined;

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center justify-center font-medium text-cream",
        ring ? "ring-2 ring-surface" : "",
        isLarge ? "font-serif" : "",
      ].join(" ")}
      style={{
        width: len,
        height: len,
        minWidth: len,
        minHeight: len,
        borderRadius: "50%",
        backgroundColor: personaColor(color),
        fontSize: `calc(${len} * 0.4)`,
        lineHeight: 1,
        boxShadow: shadows,
      }}
      aria-label={name}
    >
      {personaInitial(name)}
    </span>
  );
}
