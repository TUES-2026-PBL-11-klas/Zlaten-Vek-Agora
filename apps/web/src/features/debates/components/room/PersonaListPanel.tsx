import { PersonaAvatar } from "../PersonaAvatar";

interface PersonaListPanelProps {
  personas: Array<{ id: string; name: string; demographic: string; color: string }>;
  activePersonaId: string | null;
}

export function PersonaListPanel({ personas, activePersonaId }: PersonaListPanelProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-hair bg-surface p-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-label">
        At the table
      </p>
      <ul className="flex flex-col gap-3">
        {personas.map((persona) => (
          <li
            key={persona.id}
            className={[
              "flex items-center gap-3 rounded-lg px-2 py-1.5 -mx-2 transition-colors",
              persona.id === activePersonaId ? "bg-surface-mut" : "",
            ].join(" ")}
          >
            <PersonaAvatar name={persona.name} color={persona.color} size={32} />
            <div className="flex flex-col">
              <span className="text-[14px] text-ink-primary">{persona.name}</span>
              <span className="text-[12px] text-ink-muted">{persona.demographic}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
