import type { DebateDetailMessageDto } from "@agora/shared";
import { PersonaAvatar } from "./PersonaAvatar";
import { personaColor } from "../lib/persona-avatar";

interface DebateTranscriptProps {
  messages: DebateDetailMessageDto[];
}

interface RoundGroup {
  roundNumber: number;
  messages: DebateDetailMessageDto[];
}

export function DebateTranscript({ messages }: DebateTranscriptProps) {
  if (messages.length === 0) {
    return (
      <p className="rounded-2xl border border-hair bg-surface px-6 py-5 text-[14px] text-ink-muted">
        No turns have been recorded yet. They will appear here as the chamber speaks.
      </p>
    );
  }

  const rounds = groupByRound(messages);

  return (
    <div className="flex flex-col gap-12">
      {rounds.map((round) => (
        <section key={round.roundNumber} className="flex flex-col gap-5">
          <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-label">
            Round {round.roundNumber}
          </p>
          <div className="flex flex-col gap-4">
            {round.messages.map((message) => (
              <QuoteCard key={message.id} message={message} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function QuoteCard({ message }: { message: DebateDetailMessageDto }) {
  const { persona } = message;
  return (
    <article className="overflow-hidden rounded-2xl border border-hair bg-surface">
      <div className="flex gap-4 px-8 py-6">
        <span
          className="mt-1 w-[3px] shrink-0 self-stretch rounded-full"
          style={{ backgroundColor: personaColor(persona.color) }}
          aria-hidden
        />
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <PersonaAvatar name={persona.name} color={persona.color} size={40} />
            <div className="flex flex-col">
              <span className="text-[14px] text-ink-primary">{persona.name}</span>
              <span className="text-[12px] text-ink-muted">{persona.demographic}</span>
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

function groupByRound(messages: DebateDetailMessageDto[]): RoundGroup[] {
  const ordered = [...messages].sort(
    (a, b) => a.roundNumber - b.roundNumber || a.sequence - b.sequence,
  );
  const groups = new Map<number, DebateDetailMessageDto[]>();
  for (const message of ordered) {
    const bucket = groups.get(message.roundNumber) ?? [];
    bucket.push(message);
    groups.set(message.roundNumber, bucket);
  }
  return [...groups.entries()].map(([roundNumber, msgs]) => ({ roundNumber, messages: msgs }));
}
