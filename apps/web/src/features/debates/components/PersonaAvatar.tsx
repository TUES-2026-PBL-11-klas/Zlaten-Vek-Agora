import type { Emotion } from "@agora/shared";
import { personaColor, personaInitial } from "../lib/persona-avatar";
import { emotionHex } from "../lib/emotion-color";

interface PersonaAvatarProps {
  name: string;
  color: string;
  size?: number;
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
  const glow = emotion ? `0 0 ${Math.round(size * 0.4)}px ${emotionHex(emotion)}66` : undefined;
  const activeRing = active
    ? `0 0 0 3px var(--color-surface), 0 0 0 6px ${personaColor(color)}`
    : undefined;
  const shadows = [glow, activeRing].filter(Boolean).join(", ") || undefined;

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center justify-center font-medium text-cream",
        ring ? "ring-2 ring-surface" : "",
        size >= 56 ? "font-serif" : "",
      ].join(" ")}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: "50%",
        backgroundColor: personaColor(color),
        fontSize: Math.round(size * 0.4),
        lineHeight: 1,
        boxShadow: shadows,
      }}
      aria-label={name}
    >
      {personaInitial(name)}
    </span>
  );
}
