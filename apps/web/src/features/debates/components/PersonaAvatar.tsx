import { personaColor, personaInitial } from "../lib/persona-avatar";

interface PersonaAvatarProps {
  name: string;
  color: string;
  size?: number;
  ring?: boolean;
}

export function PersonaAvatar({ name, color, size = 32, ring = false }: PersonaAvatarProps) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-full font-medium text-cream",
        ring ? "ring-2 ring-surface" : "",
      ].join(" ")}
      style={{
        width: size,
        height: size,
        backgroundColor: personaColor(color),
        fontSize: Math.round(size * 0.4),
      }}
      aria-label={name}
    >
      {personaInitial(name)}
    </span>
  );
}
