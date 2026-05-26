import type { DebateDetailMessageDto } from "@agora/shared";
import { PersonaAvatar } from "../PersonaAvatar";
import { personaColor } from "../../lib/persona-avatar";
import { emotionColor } from "../../lib/emotion-color";

interface ActiveQuoteCardProps {
  message: DebateDetailMessageDto;
}

export function ActiveQuoteCard({ message }: ActiveQuoteCardProps) {
  const { persona } = message;

  return (
    <article className="overflow-hidden rounded-2xl border border-hair bg-surface">
      <div className="flex gap-4 px-8 py-6">
        <span
          className="mt-1 w-[3px] shrink-0 self-stretch rounded-full"
          style={{ backgroundColor: personaColor(persona.color) }}
          aria-hidden
        />
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <PersonaAvatar name={persona.name} color={persona.color} size={56} />
              <div className="flex flex-col">
                <span className="text-[15px] font-medium text-ink-primary">{persona.name}</span>
                <span className="text-[13px] text-ink-muted">{persona.demographic}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-label">
                Round {message.roundNumber}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-label">
                  Feeling -
                </span>
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: emotionColor(message.emotion) }}
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted">
                  {message.emotion}
                </span>
              </span>
            </div>
          </div>
          <p className="font-serif text-[22px] italic leading-[1.4] text-ink-body">
            &ldquo;{message.content}&rdquo;
          </p>
        </div>
      </div>
    </article>
  );
}
