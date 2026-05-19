import { PersonaAvatar } from "./PersonaAvatar";

interface StackPersona {
  id: string;
  name: string;
  color: string;
}

interface PersonaStackProps {
  personas: StackPersona[];
  total: number;
  size?: number;
  max?: number;
}

export function PersonaStack({ personas, total, size = 32, max = 4 }: PersonaStackProps) {
  const visible = personas.slice(0, max);
  const overflow = Math.max(0, total - visible.length);

  return (
    <div className="flex items-center">
      {visible.map((p, idx) => (
        <span key={p.id} style={{ marginLeft: idx === 0 ? 0 : -size * 0.32 }}>
          <PersonaAvatar name={p.name} color={p.color} size={size} ring />
        </span>
      ))}
      {overflow > 0 ? (
        <span
          className="inline-flex items-center justify-center rounded-full bg-surface-2 text-ink-muted ring-2 ring-surface"
          style={{
            width: size,
            height: size,
            marginLeft: -size * 0.32,
            fontSize: Math.round(size * 0.35),
          }}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
